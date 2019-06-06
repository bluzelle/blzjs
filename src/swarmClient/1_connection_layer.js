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
const {coloredNonce, coloredString} = require('./log');


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

    constructor({log, logDetailed, entry, onIncomingMsg, onclose, peerslist}) {

        this.log = log;
        this.logDetailed = logDetailed;
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

        this.log && logOutgoing(bin, this);

        this.connection_pool.forEach(connection => connection.send(bin));

    }

    sendIncomingMsg(bin) {

        // This method is called by all the connections inside of the connection pool

        const actual_bin = Buffer.from(bin.data);

        this.log && logIncoming(actual_bin, this);

        this.onIncomingMsg(actual_bin);

    }

    close() {

        this.connection_pool.forEach(connection => connection.die());

    }

};


// runs function only once
const once = f => {

    let called = false;

    return (...args) => {

        if(!called) {

            f(...args);
            called = true;

        }        

    }

};  



class GenericSocket {

    constructor({entry, onmessage, connection_pool, log, peerslist, onclose}) {

        this.log = log;

        this.log && this.log('Opening socket at ' + entry);

        this.onclose = (onclose && once(onclose)) || (() => {});

        this.entry = entry;
        this.onmessage = onmessage;
        this.connection_pool = connection_pool;
        this.peerslist = peerslist;

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
        this.socket.addEventListener('close', () => this.die());

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

        this.onclose();

    }

}


class PrimarySocket extends GenericSocket {

    constructor(...args) {

        super(...args);

        this.socket_info = observable();

    }


    async createSocket() {


        // This message establishes websockets with all the peers and keeps the one
        // that opens first.


        const entrySocket = new WebSocket(this.entry);
        entrySocket.binaryType = 'arraybuffer';



        // Attempts to establish connections with all the nodes and chooses the fastest one

        const peers = Object.entries(this.peerslist);
        const entries = peers.map(([_, {nodeHost, nodePort}]) => 'ws://' + nodeHost + ':' + nodePort);

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
        this.socket_info.set(peers[connections.indexOf(best_connection)]);

        this.socket.addEventListener('message', bin => this.onmessage(bin));
        this.socket.addEventListener('error', this.onclose);
        this.socket.addEventListener('close', this.onclose);

        this.socket.addEventListener('error', () => this.die());

        // Flush messages

        this.queue.forEach(bin => this.send(bin));
        this.queue = [];


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



const highlight = str => '\x1b[4m' + str + '\x1b[0m';

const logIncoming = (bin, obj) => {

    const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(new Uint8Array(bin));

    assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

    assert(bzn_envelope.hasDatabaseResponse() || bzn_envelope.hasStatusResponse());


    if(bzn_envelope.hasDatabaseResponse()) {

        const database_response = database_pb.database_response.deserializeBinary(bzn_envelope.getDatabaseResponse());

        assert(database_response instanceof database_pb.database_response);


        const bzn_json = bzn_envelope.toObject();
        const database_response_json = filterUndefined(database_response.toObject());
        database_response_json.bzn = {};

        database_response_json.bzn.sender = bzn_json.sender;
        database_response_json.bzn.signature = bzn_json.signature;
        database_response_json.bzn.timestamp = bzn_json.timestamp;
        database_response_json.bzn.swarm_id = bzn_json.swarmId;


        obj.log(highlight('Incoming') + ' ' + coloredNonce(database_response_json.header.nonce) + ' with sender ' + coloredString('...' + bzn_json.sender.slice(100)));
        
        if(obj.logDetailed) {
            obj.log(JSON.stringify(database_response_json));
        }

    }

    if(bzn_envelope.hasStatusResponse()) {

        const status_response = status_pb.status_response.deserializeBinary(bzn_envelope.getStatusResponse());

        assert(status_response instanceof status_pb.status_response);

        const bzn_json = bzn_envelope.toObject();
        const status_response_json = filterUndefined(status_response.toObject());
        status_response_json.bzn = {};

        status_response_json.bzn.sender = bzn_json.sender;
        status_response_json.bzn.signature = bzn_json.signature;
        status_response_json.bzn.timestamp = bzn_json.timestamp;
        status_response_json.bzn.swarm_id = bzn_json.swarmId;


        obj.log(highlight('Incoming') + ' status_response');

        if(obj.loadDetailed) {
            obj.log(JSON.stringify(status_response_json));
        }

    }

};


const logOutgoing = (bin, obj) => {

    const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(bin);

    assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

    assert(bzn_envelope.hasDatabaseMsg() || bzn_envelope.hasStatusRequest());


    if(bzn_envelope.hasDatabaseMsg()) {

        const database_msg = database_pb.database_msg.deserializeBinary(bzn_envelope.getDatabaseMsg());

        assert(database_msg instanceof database_pb.database_msg);


        const bzn_json = bzn_envelope.toObject();
        const database_msg_json = filterUndefined(database_msg.toObject());

        database_msg_json.bzn = {};

        database_msg_json.bzn.sender = bzn_json.sender;
        database_msg_json.bzn.signature = bzn_json.signature;
        database_msg_json.bzn.timestamp = bzn_json.timestamp;
        database_msg_json.bzn.swarm_id = bzn_json.swarmId;

        obj.log(highlight('Outgoing') + ' ' + coloredNonce(database_msg_json.header.nonce));

        if(obj.logDetailed) {
            obj.log(JSON.stringify(database_msg_json));
        }

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


        obj.log(highlight('Outgoing') + ' status_request');

        if(obj.loadDetailed) {
            obj.log(JSON.stringify(bzn_stuff_filtered));
        }

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
