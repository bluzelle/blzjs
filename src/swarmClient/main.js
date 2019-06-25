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


const {Connection} = require('./1_connection_layer');
const Serialization = require('./2_serialization_layer');
const Crypto = require('./3_crypto_layer');
const Collation = require('./4_collation_layer');
const Broadcast = require('./5_broadcast_layer');
const Redirect = require('./6_redirect_layer');
const Envelope = require('./7_envelope_layer');
const Metadata = require('./8_metadata_layer');
const API = require('./9_api_layer');

const WebSocket = require('isomorphic-ws');


const { pub_from_priv, import_private_key_from_base64, import_public_key_from_base64 } = require('./ecdsa_secp256k1');
const assert = require('assert');


module.exports = {
    swarmClient: async ({private_pem, public_pem, uuid, swarm_id, peerslist, log, logDetailed, p2p_latency_bound, onclose}) => {

        p2p_latency_bound = p2p_latency_bound || 100;

        onclose = (onclose && once(onclose)) || (() => {});



        // Add timestamp to logs
        const timestamp = () => {
            const d = new Date();
            return '[' + d.getMinutes().toString().padStart(2, '0') + ':' + 
                         d.getSeconds().toString().padStart(2, '0') + ':' + 
                         d.getMilliseconds().toString().padEnd(3, '0') + '] ';
        };


        if(log) {   

            // Default log is console.log, but you can pass any other function.
            if(typeof log !== 'function') {
                log = console.log.bind(console);
            }

            const log_ = log;
            log = ((a, ...args) => log_(timestamp() + a, ...args));;

        }


        if(public_pem) {
            // throws an error if key is malformed
            import_public_key_from_base64(public_pem);
        }

        public_pem = public_pem || pub_from_priv(private_pem);



        const [ws, entry_uuid, entry_obj] = await fastest_peer(peerslist, log);
        ws.addEventListener('close', () => onclose());


        const connection_layer = new Connection({ 
            ws,
            log, 
            logDetailed,
        });

        const broadcast_layer = new Broadcast({ 
            p2p_latency_bound, 
            peerslist, 
            connection_layer, 
            log, });


        const layers = [

            connection_layer,

            new Serialization({}),
            new Crypto({ private_pem, public_pem, log, }), 
            new Collation({ peerslist, point_of_contact: entry_uuid, log, }), 

            broadcast_layer,

            new Redirect({}),
            new Envelope({ swarm_id }),
            new Metadata({ uuid: uuid || public_pem, log, }),

        ];


        const sandwich = connect_layers(layers);

        const api = new API(sandwich.sendOutgoingMsg);
        

        api.close = () => {
            connection_layer.close();
            broadcast_layer.close();
        }

        api.swarm_id = swarm_id;
        api.entry_uuid = entry_uuid;
        api.entry_obj = entry_obj;


        return api;

    },
};


const connect_layers = layers => {

    layers.forEach((layer, i) => {

        const precedessor = 
            i === 0 ? 
                undefined : 
                layers[i - 1];

        const successor = 
            i === layers.length - 1 ? 
                undefined : 
                layers[i + 1];


        if(precedessor) {
            layer.onOutgoingMsg = precedessor.sendOutgoingMsg.bind(precedessor);
        }

        if(successor) {
            layer.onIncomingMsg = successor.sendIncomingMsg.bind(successor);
        }

    });


    const last = layers[layers.length - 1];

    return {
        sendOutgoingMsg: last.sendOutgoingMsg.bind(last)
    };

};


// runs function only once
const once = f => {

    let called = false;

    return (...args) => {

        if(!called) {

            f(...args);
            called = true;

        }        

    }

};  



const fastest_peer = async (peerslist, log) => {

    const entries = Object.entries(peerslist);

    let sockets = entries.map(([_, obj]) => 'ws://' + obj.nodeHost + ':' + obj.nodePort);


    const WS = entry => {

        const ws = new WebSocket(entry);
        ws.binaryType = 'arraybuffer';

        const error_listener = e => {log && log('WS Error: ' + e.message)};

        // hide errors
        ws.addEventListener('error', error_listener);


        const p = new Promise((res, rej) => {
        
            ws.addEventListener('open', () => {

                // ws.removeEventListener('error', error_listener);
                res(ws);

            });

        });

        p.socket = ws;


        return p;

    };


    sockets = sockets.map(WS);

    const ws = await Promise.race(sockets);

    sockets = sockets.map(s => s.socket);


    // close the failures
    sockets.forEach(w => (w !== ws) && 
        w.readyState === 1 ? 
            w.close() : 
            w.addEventListener('open', () => w.close()));


    const [entry_uuid, entry_obj] = entries[sockets.indexOf(ws)];

    return [ws, entry_uuid, entry_obj];

};