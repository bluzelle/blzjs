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


const database_pb = require('../proto/database_pb');
const bigInt = require('big-integer');
const assert = require('assert');


module.exports = class Metadata {

    constructor({uuid, onOutgoingMsg}) {

        this.uuid = uuid;
        this.onOutgoingMsg = onOutgoingMsg;

        this.nonceMap = new Map();

    }


    // fn is called instead of onIncomingMsg because it's specific
    // to the request.

    // fn returning true means to delete the entry from nonceMap.

    sendOutgoingMsg(msg, fn) {

        assert(msg instanceof database_pb.database_msg);

        const header = new database_pb.database_header();

        header.setDbUuid(this.uuid);


        const nonce = generateNonce();

        header.setNonce(nonce);

        msg.setHeader(header);

        this.nonceMap.set(nonce, fn);

        this.onOutgoingMsg(msg);

    }


    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response);

        const header = msg.getHeader();

        assert(header.getDbUuid() === this.uuid);

        const nonce = header.getNonce();


        assert(this.nonceMap.has(nonce), 
            'Metadata layer: nonce doesn\'t belong to map. Was it terminated too early?');


        const fn = this.nonceMap.get(nonce);


        if(fn(msg)) {

            this.nonceMap.delete(nonce);

        }

    }

};


const generateNonce = () => {

    // We would normally do 

    // Math.floor(Math.random() * Math.pow(2, 64));

    // however JS integers are capped at 2^54

    // So we need to generate a string of the decimal int going up to 2^64-1.

    const high_32 = Math.floor(Math.random() * Math.pow(2, 32));

    const low_32 = Math.floor(Math.random() * Math.pow(2, 32));

    return bigInt(high_32).shiftLeft(32).plus(low_32).toString();

};