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
const bluzelle_pb = require('../proto/bluzelle_pb');
const database_pb = require('../proto/database_pb');
const status_pb = require('../proto/status_pb');



module.exports = class Crypto {

    constructor({onIncomingMsg, onOutgoingMsg}) {

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

        bzn_envelope.setTimestamp(timestamp);

        this.onOutgoingMsg(bzn_envelope);

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        if(bzn_envelope.hasStatusResponse()) {

            const status_response = status_pb.status_response.deserializeBinary(new Uint8Array(bzn_envelope.getStatusResponse()));
            this.onIncomingMsg(status_response);

        }

        if(bzn_envelope.hasDatabaseResponse()) {

            const database_response = database_pb.database_response.deserializeBinary(new Uint8Array(bzn_envelope.getDatabaseResponse()));
            this.onIncomingMsg(database_response);

        }

    }

};