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
const bluzelle_pb = require('../../proto/bluzelle_pb');
const database_pb = require('../../proto/database_pb');
const status_pb = require('../../proto/status_pb');
const {coloredNonce, coloredString} = require('./log');



module.exports = class Collation {

    constructor({onIncomingMsg, onOutgoingMsg, peerslist, point_of_contact, log}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

        this.peerslist = peerslist;
        this.point_of_contact = point_of_contact;

        this.log = log;


        this.f = Math.floor(Object.keys(peerslist).length / 3) + 1;

        log && log('Collation threshold: ', this.f);

        // Maps nonces to the number of signatures they have accumulated.
        // A field in this map means an outgoing message is awaiting a reply
        
        // For each nonce we have a payload map going to a signature set.

        // For messages that don't need collation, the value is `true`.

        this.nonceMap = new Map();

    }


    sendOutgoingMsg(bzn_envelope, msg) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);


        // Skip status requests

        if(msg instanceof status_pb.status_request) {
            this.onOutgoingMsg(bzn_envelope, msg);
            return;
        }


        msg.getHeader().setPointOfContact(this.point_of_contact);

        const nonce = msg.getHeader().getNonce();


        // quickreads do not need collation
        const nonceMap_value = msg.hasQuickRead() ? true : new Map();

        this.nonceMap.set(nonce, nonceMap_value);


        this.onOutgoingMsg(bzn_envelope, msg);

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        if(bzn_envelope.hasStatusResponse()) {

            this.onIncomingMsg(bzn_envelope);
            return;

        } else {

            assert(bzn_envelope.hasDatabaseResponse());

            const sender = bzn_envelope.getSender();


            const payload = bzn_envelope.getDatabaseResponse();
            const hex_payload = Buffer.from(payload).toString('hex');

            const database_response = database_pb.database_response.deserializeBinary(new Uint8Array(bzn_envelope.getDatabaseResponse()));

            const header = database_response.getHeader();

            const nonce = header.getNonce();


            // The message has already acheived the required number of signatures
            if(!this.nonceMap.has(nonce)) {
                return;
            }


            // If this message bypasses the collation process
            if(this.nonceMap.get(nonce) === true) {

                this.nonceMap.delete(nonce);
                this.onIncomingMsg(bzn_envelope);

                return;

            }

        
            // Discard senders that aren't on the peers list
            if(!Object.keys(this.peerslist).includes(sender)) {
                this.log && this.log("Discarding invalid sender " + coloredString('...' + sender.slice(100)) + "; not on peerslist.");
                return;
            }


            // Collation logic: increment the signature counter and resolve when we have received enough
            
            const payloadMap = this.nonceMap.get(nonce);


            // we can hash the hex_payload if necessary

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
                this.onIncomingMsg(bzn_envelope);

                return;

            }

        }

    }

};