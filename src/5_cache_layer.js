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
const assert = require('assert');

module.exports = class Cache {

    constructor({onIncomingMsg, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

        this.cache = new Map();
        this.retries = new Map();

        this.MAX_RETRIES = 3;
        this.RETRY_TIMEOUT = 300;

    }


    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response);

        const nonce = msg.getHeader().getNonce();

        assert(this.cache.has(nonce));
        assert(this.retries.has(nonce));


        if(msg.hasError() && ['CONNECTION NOT OPEN', 'ELECTION IN PROGRESS'].includes(msg.getError().getMessage())) {


            // Failure

            if(this.retries.get(nonce) === this.MAX_RETRIES) {

                msg.getError().setMessage(msg.getError().getMessage() 
                        + " / FAILED " + this.MAX_RETRIES + " RETRIES @ " + this.RETRY_TIMEOUT + "ms");

                this.cache.delete(nonce);
                this.retries.delete(nonce);
                this.onIncomingMsg(msg);


            // Execute a retry 

            } else {

                const original_msg = this.cache.get(nonce);
                
                setTimeout(
                    () => this.sendOutgoingMsg(original_msg),
                    this.RETRY_TIMEOUT
                );

            }

        } else {

            // Success

            this.cache.delete(nonce);
            this.retries.delete(nonce);
            this.onIncomingMsg(msg);

        }

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg);

        const nonce = msg.getHeader().getNonce();

        this.cache.set(nonce, msg);

        this.retries.has(nonce) ? 
            this.retries.set(nonce, this.retries.get(nonce) + 1) :
            this.retries.set(nonce, 0);

        this.onOutgoingMsg(msg);

    }

};