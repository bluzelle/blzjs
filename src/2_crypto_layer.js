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

    constructor({private_pem, onIncomingMsg, onOutgoingMsg}) {

        this.private_pem = private_pem;
        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

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
        const sender = pub_from_priv(this.private_pem);
        
        
        const bin_for_the_win = Buffer.concat([
            sender, 
            bzn_envelope.getPayloadCase(), 
            Buffer.from(payload), 
            timestamp
        ].map(deterministic_serialize));


        bzn_envelope.setSender(sender);
        bzn_envelope.setSignature(new Uint8Array(sign(bin_for_the_win, this.private_pem)));
        bzn_envelope.setTimestamp(timestamp);

        const ultimate_bin = bzn_envelope.serializeBinary();

        this.onOutgoingMsg(ultimate_bin);

    }


    sendIncomingMsg(bin) {

        assert(bin instanceof Buffer);

        const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(new Uint8Array(bin));

        assert(bzn_envelope.hasDatabaseResponse() || bzn_envelope.hasStatusResponse());


        // Verification of incoming messages

        const payload = 
            bzn_envelope.hasDatabaseResponse() ? 
                bzn_envelope.getDatabaseResponse() : 
                bzn_envelope.getStatusResponse();

        const bin_for_the_win = Buffer.concat([
            bzn_envelope.getSender(), 
            bzn_envelope.getPayloadCase(), 
            Buffer.from(payload), 
            bzn_envelope.getTimestamp()
        ].map(deterministic_serialize));


        assert(
            verify(Buffer.from(bin_for_the_win), Buffer.from(bzn_envelope.getSignature()), bzn_envelope.getSender()), 
            'Signature failed to verify.\n' + Buffer.from(bin).toString('hex'));
        

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
