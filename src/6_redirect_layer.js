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


const database_pb = require('../proto/database_pb');
const status_pb = require('../proto/status_pb');

const assert = require('assert');


module.exports = class Redirect {

    constructor({onIncomingMsg, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

    }

    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);

        // Pass through
        this.onOutgoingMsg(msg);

    }

    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response || msg instanceof status_pb.status_response);

        assert(msg instanceof status_pb.status_response || !msg.hasRedirect(), 
            'Daemon returned redirection.');

        this.onIncomingMsg(msg);

    }

};