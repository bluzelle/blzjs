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


const assert = require('assert');
const database_pb = require('../proto/database_pb');
const bluzelle_pb = require('../proto/bluzelle_pb');
const status_pb = require('../proto/status_pb');



module.exports = class Collation {

    constructor({onIncomingMsg, onOutgoingMsg, connection_layer}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;


        // Queue messages when we don't have the node uuid in socket_info.
        this.outgoingQueue = [];


        // Maps nonces to the number of signatures they have accumulated.
        // A field in this map means an outgoing message is awaiting a reply
        
        // For each nonce we have a payload map going to a signature set.

        // For messages that don't need collation, the value is `true`.

        this.nonceMap = new Map();


        this.connection_layer = connection_layer;

        this.connection_layer.primary_socket.socket_info.observe(v => {
            const q = this.outgoingQueue;
            this.outgoingQueue = [];
            q.forEach(msg => this.sendOutgoingMsg(msg));
        });


        this.peers;
        this.f;

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);


        // Skip status requests

        if(msg instanceof status_pb.status_request) {
            this.onOutgoingMsg(msg);
            return;
        }


        if(!this.connection_layer.primary_socket.socket_info.get()) {

            // Without the necessary metadata, queue the message

            this.outgoingQueue.push(msg);

        } else {

            const node_uuid = this.connection_layer.primary_socket.socket_info.get().uuid;

            assert(node_uuid);
            
            msg.getHeader().setPointOfContact(node_uuid);


            const nonce = msg.getHeader().getNonce();


            // quickreads do not need collation
            const nonceMap_value = msg.hasQuickRead() ? true : new Map();

            this.nonceMap.set(nonce, nonceMap_value);


            this.onOutgoingMsg(msg);

        }

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        if(bzn_envelope.hasStatusResponse()) {

            const status_response = status_pb.status_response.deserializeBinary(new Uint8Array(bzn_envelope.getStatusResponse()));

            // Collation logic: update number of required signatures
            // f = floor( |peers list| / 3 ) + 1


            this.peers = JSON.parse(status_response.toObject().moduleStatusJson).module[0].status.peer_index;
            this.f = Math.floor(this.peers.length / 3) + 1;

            this.onIncomingMsg(status_response);


        } else {

            assert(bzn_envelope.hasDatabaseResponse());
            assert(this.f && this.peers);

            const sender = bzn_envelope.getSender();


            // Discard senders that aren't on the peers list
            if(!this.peers.map(p => p.uuid).includes(sender)) {
                return;
            }


            const payload = bzn_envelope.getDatabaseResponse();
            const hex_payload = Buffer.from(payload).toString('hex');

            const database_response = database_pb.database_response.deserializeBinary(new Uint8Array(payload));

            const header = database_response.getHeader();

            const nonce = header.getNonce();


            // The message has already acheived the required number of signatures
            if(!this.nonceMap.has(nonce)) {
                return;
            }


            // If this message bypasses the collation process
            if(this.nonceMap.get(nonce) === true) {

                this.nonceMap.delete(nonce);
                this.onIncomingMsg(database_response);

                return;

            }


            // Collation logic: increment the signature counter and resolve when we have received enough
            
            const payloadMap = this.nonceMap.get(nonce);

            if(!payloadMap.has(hex_payload)) {
                payloadMap.set(hex_payload, []);
            }

            const senders = payloadMap.get(hex_payload);

            if(!senders.includes(sender)) {
                senders.push(sender);
            }

            // On success
            if(senders.length >= this.f) {

                this.nonceMap.delete(nonce);
                this.onIncomingMsg(database_response);

                return;

            }

        }

    }

};