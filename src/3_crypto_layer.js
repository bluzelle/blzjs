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
const { verify, sign, pub_from_priv } = require('./ecdsa_secp256k1');
const database_pb = require('../proto/database_pb');
const bluzelle_pb = require('../proto/bluzelle_pb');
const status_pb = require('../proto/status_pb');


module.exports = class Crypto {

    constructor({private_pem, onIncomingMsg, onOutgoingMsg, log}) {

        this.log = log;

        this.private_pem = private_pem;
        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;


        // set of nonces for outstanding quickreads to ignore verification
        // quickreads only get one response, so we can delete from here on receipt
        this.quickreads = new Set();

        this.public_key = pub_from_priv(this.private_pem);

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);

        const bzn_envelope = new bluzelle_pb.bzn_envelope();


        const payload = msg.serializeBinary();

        if(msg instanceof database_pb.database_msg) {
            bzn_envelope.setDatabaseMsg(payload);
        }

        if(msg instanceof status_pb.status_request) {
            bzn_envelope.setStatusRequest(payload);
        }


        const timestamp = new Date().getTime();        
        
        const signed_bin = Buffer.concat([
            this.public_key, 
            bzn_envelope.getPayloadCase(), 
            Buffer.from(payload), 
            timestamp
        ].map(deterministic_serialize));


        bzn_envelope.setTimestamp(timestamp);
        //bzn_envelope.setSender(sender);
        // bzn_envelope.setSignature(new Uint8Array(sign(signed_bin, this.private_pem)));


        // quickreads are not signed
        const isQuickread = msg instanceof database_pb.database_msg && msg.hasQuickRead();

        if(isQuickread) {
            this.quickreads.add(msg.getHeader().getNonce());
        } else {
            bzn_envelope.setSender(this.public_key);
            bzn_envelope.setSignature(new Uint8Array(sign(signed_bin, this.private_pem)));
        }


        this.onOutgoingMsg(bzn_envelope);

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);


        // Verification of incoming messages

        const payload = 
            bzn_envelope.hasDatabaseResponse() ? 
                bzn_envelope.getDatabaseResponse() : 
                bzn_envelope.getStatusResponse();

        const signed_bin = Buffer.concat([
            bzn_envelope.getSender(), 
            bzn_envelope.getPayloadCase(), 
            Buffer.from(payload), 
            bzn_envelope.getTimestamp()
        ].map(deterministic_serialize));



        // quickreads skip verification
        if(bzn_envelope.hasDatabaseResponse()) {
            const nonce = database_pb.database_response.deserializeBinary(new Uint8Array(bzn_envelope.getDatabaseResponse())).getHeader().getNonce();

            if(this.quickreads.has(nonce)) {
                this.quickreads.delete(nonce);
                this.onIncomingMsg(bzn_envelope);
                return;
            }
        }


        if(!verify(Buffer.from(signed_bin), Buffer.from(bzn_envelope.getSignature()), bzn_envelope.getSender())) {            
            this.log && this.log('Bluzelle: signature failed to verify: ' + Buffer.from(bin).toString('hex'));
        }

        this.onIncomingMsg(bzn_envelope);

    }

};


// see crypto.cpp in daemon

const deterministic_serialize = obj => {

    if(obj instanceof Buffer) {

        return Buffer.concat([
            Buffer.from(obj.length.toString() + '|', 'ascii'),
            obj
        ]);

    }


    // numbers and strings

    return Buffer.from(obj.toString().length + '|' + obj.toString(), 'ascii');

};
