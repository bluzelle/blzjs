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
const {BroadcastSocket} = require('./1_connection_layer');


// This construction gives you a function, clearTimeouts, that clears
// all the active timeouts without knowing their explicit id's.

const timeout = (() => {

    const timeouts = new Set();

    return {
        setTimeout: (f, t) => {
            let id = setTimeout(() => {
                timeouts.delete(id);
                f();
            }, t);

            timeouts.add(id);
        },

        clearTimeouts: () => timeouts.forEach(clearTimeout)
    };

})();


module.exports = class Broadcast {

    constructor({p2p_latency_bound, peerslist, connection_layer, onIncomingMsg, log, onOutgoingMsg}) {

        this.onIncomingMsg = onIncomingMsg;
        this.onOutgoingMsg = onOutgoingMsg;

        this.log = log;

        this.p2p_latency_bound = p2p_latency_bound;
        this.connection_layer = connection_layer;

        this.peerslist = peerslist;


        this.sockets;

        this.timeout = p2p_latency_bound * 15;

        this.timeoutFns = new Map();

    }


    sendOutgoingMsg(bzn_envelope, msg) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);

        if(msg instanceof database_pb.database_msg) {

            // Do not broadcast quickreads

            if(msg.hasQuickRead()) {
                this.onOutgoingMsg(bzn_envelope, msg);
                return;
            }


            const nonce = msg.getHeader().getNonce();
            timeout.setTimeout(() => {
                    
                const fn = this.timeoutFns.get(nonce);
                this.timeoutFns.delete(nonce);
                fn();

            }, this.timeout);


            // This gets overwritten when the messages comes back
            // so a properly-responded message does not execute a broadcast

            this.timeoutFns.set(nonce, () => this.broadcast(bzn_envelope, msg)); 

        } 

        this.onOutgoingMsg(bzn_envelope, msg);

    }


    sendIncomingMsg(bzn_envelope) {

        assert(bzn_envelope instanceof bluzelle_pb.bzn_envelope);


         if(bzn_envelope.hasDatabaseResponse()) {

            const database_response = database_pb.database_response.deserializeBinary(new Uint8Array(bzn_envelope.getDatabaseResponse()));

            const nonce = database_response.getHeader().getNonce();

            if(this.timeoutFns.has(nonce)) {
                this.timeoutFns.set(nonce, () => {});

                this.sockets && this.sockets.forEach(socket => socket.die());
                this.sockets = undefined;
            }

        }

        this.onIncomingMsg(bzn_envelope);

    }


    broadcast(bzn_envelope, msg) {

        this.log && this.log('Rebroadcasting msg');


        if(!this.sockets) { 

            this.sockets = Object.values(this.peerslist).map(peer => new BroadcastSocket({
                onmessage: m => this.connection_layer.sendIncomingMsg(m),
                entry: 'ws://' + peer.nodeHost + ':' + peer.nodePort,
                connection_pool: this.connection_layer.connection_pool,
                log: this.log
            }));

        }

        this.sendOutgoingMsg(bzn_envelope, msg);

    }


    close() {

        timeout.clearTimeouts();

    }

};