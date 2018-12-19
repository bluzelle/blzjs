// Copyright (C) 2018 Bluzelle
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


module.exports = class Crypto {

    constructor({private_pem, onIncomingMsg, onOutgoingMsg}) {

        this.private_pem = private_pem;
        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof bluzelle_pb.bzn_envelope);
        assert(msg.hasDatabaseMsg() || msg.hasStatusRequest());

        const payload = msg.hasDatabaseMsg() ? msg.getDatabaseMsg() : msg.getStatusRequest();


        const timestamp = new Date().getTime();
        const sender = pub_from_priv(this.private_pem);
        
        
        const bin_for_the_win = Buffer.concat([
            sender, 
            msg.getPayloadCase(), 
            Buffer.from(payload), 
            timestamp
        ].map(deterministic_serialize));


        msg.setSender(sender);
        msg.setSignature(new Uint8Array(sign(bin_for_the_win, this.private_pem)));
        msg.setTimestamp(timestamp);

        const ultimate_bin = msg.serializeBinary();

        this.onOutgoingMsg(ultimate_bin);

    }


    sendIncomingMsg(msg) {

        // If the connection layer sends an error, skip this layer.

        if(msg instanceof database_pb.database_response) {
            this.onIncomingMsg(msg);
            return;
        }   

        assert(msg instanceof Buffer);


        // Verification not implemented


        const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(new Uint8Array(msg));

        assert(bzn_envelope.hasDatabaseResponse() || bzn_envelope.hasStatusResponse());

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
