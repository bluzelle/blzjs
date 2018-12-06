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

module.exports = class Maxsize {

    constructor({onIncomingMsg, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

        this.MAX_KEY_SIZE = 4000;
        this.MAX_VALUE_SIZE = 256000;

    }


    sendIncomingMsg(msg) {

        // Pass through

        this.onIncomingMsg(msg);

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg);


        this.onOutgoingMsg(msg);

    }

};