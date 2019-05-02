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

module.exports = class Crypto {

    constructor({onIncomingMsg, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

    }


    sendOutgoingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        const bin = bzn_envelope.serializeBinary();

        this.onOutgoingMsg(bin);

    }


    sendIncomingMsg(bin) {

        assert(bin instanceof Buffer);

        const bzn_envelope = bluzelle_pb.bzn_envelope.deserializeBinary(new Uint8Array(bin));

        assert(bzn_envelope.hasDatabaseResponse() || bzn_envelope.hasStatusResponse());

        this.onIncomingMsg(bzn_envelope);

    }

};