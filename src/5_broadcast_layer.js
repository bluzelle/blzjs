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
const database_pb = require('../proto/database_pb');
const bluzelle_pb = require('../proto/bluzelle_pb');
const status_pb = require('../proto/status_pb');
const {GenericSocket} = require('./1_connection_layer');


module.exports = class Broadcast {

    constructor({p2p_latency_bound, connection_layer, onIncomingMsg, log, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

        this.log = log;

        this.p2p_latency_bound = p2p_latency_bound;
        this.connection_layer = connection_layer;

        this.peers = [];
        this.sockets;

        this.timeout = p2p_latency_bound * 15;

        this.timeoutFns = new Map();

    }


    sendOutgoingMsg(msg) {

        assert(msg instanceof database_pb.database_msg || msg instanceof status_pb.status_request);

        if(msg instanceof database_pb.database_msg) {

            const nonce = msg.getHeader().getNonce();
            setTimeout(() => {
                    
                const fn = this.timeoutFns.get(nonce);
                this.timeoutFns.delete(nonce);
                fn();

            }, this.timeout);


            // This gets overwritten when the messages comes back
            // so a properly-responded message does not execute a broadcast

            this.timeoutFns.set(nonce, () => this.broadcast(msg)); 

        } 

        this.onOutgoingMsg(msg);

    }


    sendIncomingMsg(msg) {

        assert(msg instanceof database_pb.database_response || msg instanceof status_pb.status_response);

        if(msg instanceof status_pb.status_response) {

            this.peers = JSON.parse(msg.toObject().moduleStatusJson).module[0].status.peer_index;

        }


        if(msg instanceof database_pb.database_response) {

            const nonce = msg.getHeader().getNonce();

            if(this.timeoutFns.has(nonce)) {
                this.timeoutFns.set(nonce, () => {});

                this.sockets && this.sockets.forEach(socket => socket.die());
                this.sockets = undefined;
            }

        }

        this.onIncomingMsg(msg);

    }


    broadcast(msg) {

        this.log && this.log('Rebroadcasting msg ' + msg.getHeader().getNonce());

        assert(this.peers.length > 0);


        if(!this.sockets) { 

            this.sockets = this.peers.map(peer => new GenericSocket({
                onmessage: m => this.connection_layer.sendIncomingMsg(m),
                entry: 'ws://' + peer.host + ':' + peer.port,
                connection_pool: this.connection_layer.connection_pool,
                log: this.log
            }));

        }

        this.sendOutgoingMsg(msg);

    }

};