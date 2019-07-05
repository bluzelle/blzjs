//
// Copyright (C) 2019 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


const bluzelle_pb = require('../../proto/bluzelle_pb');
const database_pb = require('../../proto/database_pb');
const status_pb = require('../../proto/status_pb');

const bigInt = require('big-integer');
const assert = require('assert');


module.exports = class Metadata {

    constructor({uuid, onOutgoingMsg, log}) {

        this.uuid = uuid;
        this.onOutgoingMsg = onOutgoingMsg;

        this.log = log;

        this.nonceMap = new Map();
        this.status_fns = [];

    }


    // fn is called instead of onIncomingMsg because it's specific
    // to the request.

    // fn returning true means to delete the entry from nonceMap.

    sendOutgoingMsg(msg, fn) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);


        if(msg instanceof status_pb.status_request) {
            this.status_fns.push(fn);
            this.onOutgoingMsg(msg);

            return;
        }


        const header = new database_pb.database_header();

        header.setDbUuid(this.uuid);


        const nonce = generateNonce();

        header.setNonce(nonce);

        msg.setHeader(header);

        this.nonceMap.set(nonce, fn);

        this.onOutgoingMsg(msg);

    }


    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response || msg instanceof status_pb.status_response);

        if(msg instanceof status_pb.status_response) {
            const s = this.status_fns;
            this.status_fns = [];
            s.forEach(fn => fn(msg));

            return;
        }


        const header = msg.getHeader();

        assert(header.getDbUuid() === this.uuid);

        const nonce = header.getNonce();


        if(!this.nonceMap.has(nonce)) {
            this.log && this.log('Metadata layer: nonce ' + nonce + ' doesn\'t belong to an outstanding operation.');
            return;
        }
        

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