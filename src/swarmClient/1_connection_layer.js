// Copyright (C) 2019 Bluzelle
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License, version 3,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


const WebSocket = require('isomorphic-ws');
const assert = require('assert');
const bluzelle_pb = require('../../proto/bluzelle_pb');
const database_pb = require('../../proto/database_pb');
const status_pb = require('../../proto/status_pb');



const observable = () => {

    const observers = [];
    let value;

    return {
        get: () => value,
        set: v => {
            value = v;
            observers.forEach(o => o(v));
        },
        observe: f => observers.push(f)
    };

};


class Connection {

    constructor({log, entry, onIncomingMsg, onclose}) {

        this.log = log;
        this.onIncomingMsg = onIncomingMsg;

        this.connection_pool = [];


        //this.primary_socket = new PrimarySocket({
        this.primary_socket = new GenericSocket({
            entry, 
            log,
            onmessage: this.sendIncomingMsg.bind(this), 
            connection_pool: this.connection_pool,
            onclose
        });

    }

    sendOutgoingMsg(bin) {

        this.log && logOutgoing(bin, this.log);

        this.connection_pool.forEach(connection => connection.send(bin));

    }

    sendIncomingMsg(bin) {

        // This method is called by all the connections inside of the connection pool

        const actual_bin = Buffer.from(bin.data);

        this.log && logIncoming(actual_bin, this.log);

        this.onIncomingMsg(actual_bin);

    }

    close() {

        this.connection_pool.forEach(connection => connection.die());

    }

};


class GenericSocket {

    constructor({entry, onmessage, connection_pool, log, onclose}) {

        this.log = log;

        this.log && this.log('Opening socket at ' + entry);

        this.onclose = onclose || (() => {});

        this.entry = entry;
        this.onmessage = onmessage;
        this.connection_pool = connection_pool;

        this.queue = [];

        this.createSocket();

        this.connection_pool.push(this);

    }

    createSocket() {

        this.socket = new WebSocket(this.entry);
        this.socket.binaryType = 'arraybuffer';

        this.socket.addEventListener('open', () => {
            this.queue.forEach(bin => this.send(bin));
            this.queue = [];
        });

        this.socket.addEventListener('message', bin => this.onmessage(bin));
        this.socket.addEventListener('error', () => this.die());

    }

    send(bin) {

        if(this.socket && this.socket.readyState === 1) {

            this.socket.send(bin);

        } else {

            this.queue.push(bin);

        }

    }

    die() {

        this.log && this.log('Closing socket at ' + this.entry);

        this.connection_pool.indexOf(this) !== -1 && this.connection_pool.splice(this.connection_pool.indexOf(this), 1);

        this.socket && this.socket.close();

    }

}


class PrimarySocket extends GenericSocket {

    constructor(...args) {

        super(...args);
    
        this.socket_info = observable();

    }


    createSocket() {


        // This message establishes a websocket with the entry, gets the peers list,
        // attempts to establish connections with every node, and sets this.socket to
        // be the one that opens first.

        // We could have this socket be passed as an argument to enable us to 
        // run the bootstrap multiple times over the lifetime of the client.


        const entrySocket = new WebSocket(this.entry);
        entrySocket.binaryType = 'arraybuffer';


        // Send a status request
        entrySocket.addEventListener('open', () => {

            this.log && this.log('connected to entrypoint ' + this.entry + '...');


            const bzn_envelope = new bluzelle_pb.bzn_envelope();
            bzn_envelope.setStatusRequest(new status_pb.status_request().serializeBinary());

            const bin = bzn_envelope.serializeBinary();

            entrySocket.send(bin);

            this.log && logOutgoing(bin, this.log);

        });

        entrySocket.addEventListener('message', async bin => {    

            this.log && this.log('fetched status from entry. finding fastest node...');


            entrySocket.close();

            const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(bin.data);

            assert(bzn_envelope.hasStatusResponse());


            // Propagate status response for the collation layer
            this.onmessage(bin);


            const stat = status_pb.status_response.deserializeBinary(new Uint8Array(bzn_envelope.getStatusResponse())).toObject();


            // Attempts to establish connections with all the nodes and chooses the fastest one

            const peer_index = JSON.parse(stat.moduleStatusJson).module[0].status.peer_index;

            const entries = peer_index.map(({host, port}) => 'ws://' + host + ':' + port);

            let connections = entries.map(entry => {
        
                // Ignore failed connections
                try {
                    const w = new WebSocket(entry);
                    w.onerror = e => {};

                    return w;

                } catch(e) {
                    return undefined;
                }
           
            });

            connections = connections.filter(c => c !== undefined);

            connections.forEach(ws => { ws.binaryType = 'arraybuffer'; });

            const ps = connections.map(connection => 
                new Promise(resolve => {
                    connection.addEventListener('open', () => resolve(connection))
                })
            );

            const best_connection = await Promise.race(ps);


            // Close out all other connections

            connections.filter(c => c !== best_connection).forEach(connection => 
                connection.readyState === 1 ? 

                    connection.close() : // In case two connections open very closely to one-another

                    connection.onopen = () => connection.close());


            this.log && this.log('established connection with fastest node: ' + entries[connections.indexOf(best_connection)]);


            this.socket = best_connection;
            this.socket_info.set(peer_index[connections.indexOf(best_connection)]);

            this.socket.addEventListener('message', bin => this.onmessage(bin));
            this.socket.addEventListener('error', this.onclose);
            this.socket.addEventListener('close', this.onclose);

            this.socket.addEventListener('error', () => this.die());

            // Flush messages

            this.queue.forEach(bin => this.send(bin));
            this.queue = [];

        });

    }

}


class BroadcastSocket extends GenericSocket {

    send(bin) {

        const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(new Uint8Array(bin));
        
        if(bzn_envelope.hasDatabaseMsg()) {

            const database_msg = database_pb.database_msg.deserializeBinary(new Uint8Array(bzn_envelope.getDatabaseMsg()));

            if(database_msg.hasQuickRead()) {

                // Don't send quickreads
                return;

            }

        }     

        if(bzn_envelope.hasStatusRequest()) {

            // Don't send status requests
            return;
            
        }   

        super.send(bin);

    }

}




module.exports = {
    Connection,
    GenericSocket,
    BroadcastSocket
};





const logIncoming = (bin, log) => {

    const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(new Uint8Array(bin));

    assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

    assert(bzn_envelope.hasDatabaseResponse() || bzn_envelope.hasStatusResponse());


    if(bzn_envelope.hasDatabaseResponse()) {

        const database_response = database_pb.database_response.deserializeBinary(bzn_envelope.getDatabaseResponse());

        assert(database_response instanceof database_pb.database_response);


        const bzn_stuff = bzn_envelope.toObject();
        const stuff = filterUndefined(database_response.toObject());
        stuff.bzn = {};

        stuff.bzn.sender = bzn_stuff.sender;
        stuff.bzn.signature = bzn_stuff.signature;
        stuff.bzn.timestamp = bzn_stuff.timestamp;
        stuff.bzn.swarm_id = bzn_stuff.swarmId;


        
        log('Incoming database_response\n', stuff);

    }

    if(bzn_envelope.hasStatusResponse()) {

        const status_response = status_pb.status_response.deserializeBinary(bzn_envelope.getStatusResponse());

        assert(status_response instanceof status_pb.status_response);

        const bzn_stuff = bzn_envelope.toObject();
        const stuff = filterUndefined(status_response.toObject());
        stuff.bzn = {};

        stuff.bzn.sender = bzn_stuff.sender;
        stuff.bzn.signature = bzn_stuff.signature;
        stuff.bzn.timestamp = bzn_stuff.timestamp;
        stuff.bzn.swarm_id = bzn_stuff.swarmId;



        log('Incoming status_response\n', stuff);

    }

};


const logOutgoing = (bin, log) => {

    const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(bin);

    assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

    assert(bzn_envelope.hasDatabaseMsg() || bzn_envelope.hasStatusRequest());


    if(bzn_envelope.hasDatabaseMsg()) {

        const database_msg = database_pb.database_msg.deserializeBinary(bzn_envelope.getDatabaseMsg());

        assert(database_msg instanceof database_pb.database_msg);


        const bzn_stuff = bzn_envelope.toObject();
        const stuff = filterUndefined(database_msg.toObject());

        stuff.bzn = {};

        stuff.bzn.sender = bzn_stuff.sender;
        stuff.bzn.signature = bzn_stuff.signature;
        stuff.bzn.timestamp = bzn_stuff.timestamp;
        stuff.bzn.swarm_id = bzn_stuff.swarmId;

        log('Outgoing database_msg\n', stuff);

    }

    if(bzn_envelope.hasStatusRequest()) {

        const status_request = status_pb.status_request.deserializeBinary(bzn_envelope.getStatusRequest());

        assert(status_request instanceof status_pb.status_request);


        const bzn_stuff = bzn_envelope.toObject();
        const bzn_stuff_filtered = {
            sender: bzn_stuff.sender,
            signature: bzn_stuff.signature,
            timestamp: bzn_stuff.timestamp,
            swarm_id: bzn_stuff.swarmId
        };


        log('Outgoing status_request\n', bzn_stuff_filtered);

    }

};


// Removes keys that map to undefined in an object,
// otherwise they show up in log output

const filterUndefined = obj => {

    const out = {};

    Object.keys(obj).
        filter(key => obj[key] !== undefined).
        forEach(key => out[key] = obj[key]);

    return out;

};