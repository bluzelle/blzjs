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
const bluzelle_pb = require('../proto/bluzelle_pb');
const database_pb = require('../proto/database_pb');
const status_pb = require('../proto/status_pb');



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


module.exports = class Connection {

    constructor({entry, log, onIncomingMsg}) {

        this.log = log;
        this.onIncomingMsg = onIncomingMsg;


        this.socket; 
        this.socket_info = observable();


        // queue up messages and send them when the connection opens
        this.queue = [];


        // We could have this socket be passed as an argument to enable us to 
        // run the bootstrap multiple times over the lifetime of the client.
        const entrySocket = new WebSocket(entry);
        entrySocket.binaryType = 'arraybuffer';


        // Send a status request
        entrySocket.addEventListener('open', () => {

            const bzn_envelope = new bluzelle_pb.bzn_envelope();
            bzn_envelope.setStatusRequest(new status_pb.status_request().serializeBinary());

            const bin = bzn_envelope.serializeBinary();

            entrySocket.send(bin);

            this.log && logOutgoing(bin, this.log);

        });

        entrySocket.addEventListener('message', async bin => {    

            entrySocket.close();

            const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(bin.data);

            assert(bzn_envelope.hasStatusResponse());


            // Propagate status response for the collation layer
            this.sendIncomingMsg(bin);


            const stat = status_pb.status_response.deserializeBinary(new Uint8Array(bzn_envelope.getStatusResponse())).toObject();


            // Attempts to establish connections with all the nodes and chooses the fastest one

            const peer_index = JSON.parse(stat.moduleStatusJson).module[0].status.peer_index;

            const entries = peer_index.map(({host, port}) => 'ws://' + host + ':' + port);

            const connections = entries.map(entry => new WebSocket(entry));

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


            this.socket = best_connection;
            this.socket_info.set(peer_index[connections.indexOf(best_connection)]);

            this.socket.addEventListener('message', bin => this.sendIncomingMsg(bin));


            // Flush messages

            this.queue.forEach(msg => this.sendOutgoingMsg(msg));
            this.queue = [];

        });

    }

    sendOutgoingMsg(bin) {

        if(this.socket && this.socket.readyState === 1) {

            this.log && logOutgoing(bin, this.log);
            this.socket.send(bin);

        } else {

            this.queue.push(bin);

        }

    }

    sendIncomingMsg(bin) {

        const actual_bin = Buffer.from(bin.data);

        this.log && logIncoming(actual_bin, this.log);

        this.onIncomingMsg(actual_bin);

    }

    close() {
        this.socket.close();
    }

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


        // Make sure errors don't mess up this thread
        setTimeout(() => 
            log('Incoming database_response\n', stuff),
            0);

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


        setTimeout(() => 
            log('Incoming status_response\n', stuff),
            0);

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

        setTimeout(() => 
            log('Outgoing database_msg\n', stuff),
            0);

    }

    if(bzn_envelope.hasStatusRequest()) {

        const status_request = status_pb.status_request.deserializeBinary(bzn_envelope.getStatusRequest());

        assert(status_request instanceof status_pb.status_request);


        const bzn_stuff = bzn_envelope.toObject();
        const bzn_stuff_filtered = {
            sender: bzn_stuff.sender,
            signature: bzn_stuff.signature,
            timestamp: bzn_stuff.timestamp,
        };


        setTimeout(() => 
            log('Outgoing status_request\n', bzn_stuff_filtered),
            0);

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