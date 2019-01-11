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
const database_pb = require('../proto/database_pb');
const bluzelle_pb = require('../proto/bluzelle_pb');
const status_pb = require('../proto/status_pb');


module.exports = class Switch {

    constructor({onIncomingMsg, onOutgoingMsg, onIncomingStatusResponse}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;


        // This one gets called and bypasses the rest of the layered system if it's
        // a status response. (since status responses don't have the whole nonce system)
        this.onIncomingStatusResponse = onIncomingStatusResponse;

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);

        const bzn_envelope = new bluzelle_pb.bzn_envelope();


        if(msg instanceof database_pb.database_msg) {
            bzn_envelope.setDatabaseMsg(msg.serializeBinary());
        }

        if(msg instanceof status_pb.status_request) {
            bzn_envelope.setStatusRequest(msg.serializeBinary());
        }

        this.onOutgoingMsg(bzn_envelope);

    }


    sendIncomingMsg(msg) {

        // If the connection layer sends an error, skip this layer.

        if(msg instanceof database_pb.database_response) {
            this.onIncomingMsg(msg);
            return;
        }   

        assert(msg instanceof bluzelle_pb.bzn_envelope);

        assert(msg.hasDatabaseResponse() || msg.hasStatusResponse());


        if(msg.hasDatabaseResponse()) {

            const db_resp = database_pb.database_response.deserializeBinary(new Uint8Array(msg.getDatabaseResponse()));

            this.onIncomingMsg(db_resp);
        }

        if(msg.hasStatusResponse()) {

            const status_resp = status_pb.status_response.deserializeBinary(new Uint8Array(msg.getStatusResponse()));

            this.onIncomingStatusResponse(status_resp);
        }

    }

};
