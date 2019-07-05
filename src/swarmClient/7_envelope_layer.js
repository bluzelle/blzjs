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


const assert = require('assert');
const bluzelle_pb = require('../../proto/bluzelle_pb');
const database_pb = require('../../proto/database_pb');
const status_pb = require('../../proto/status_pb');



module.exports = class Crypto {

    constructor({onIncomingMsg, onOutgoingMsg, swarm_id}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;
        this.swarm_id = swarm_id;

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);

        const bzn_envelope = new bluzelle_pb.bzn_envelope();


        const timestamp = new Date().getTime();

        bzn_envelope.setTimestamp(timestamp);
        bzn_envelope.setSwarmId(this.swarm_id);

        this.onOutgoingMsg(bzn_envelope, msg);

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