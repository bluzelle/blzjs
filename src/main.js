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


const Connection = require('./1_connection_layer');
const Crypto = require('./2_crypto_layer');
const Switch = require('./3_switch_layer');
const Redirect = require('./4_redirect_layer');
const Metadata = require('./5_metadata_layer');
const API = require('./6_api_layer');

const { pub_from_priv } = require('./ecdsa_secp256k1');

const bluzelle_pb = require('../proto/bluzelle_pb');
const status_pb = require('../proto/status_pb');


module.exports = {
    bluzelle: ({entry, private_pem, uuid, log}) => {

        // Default log is console.log, but you can pass any other function.
        if(log && typeof log !== 'function') {
            log = console.log.bind(console);
        }


        const layers = [
            new Connection({ entry, log }),
            new Crypto({ private_pem, }),  
            new Switch({ onIncomingStatusResponse: () => {} }),      
            new Redirect({}),
            new Metadata({ uuid, }),
        ];

        const sandwich = connect_layers(layers);

        api = new API(sandwich.sendOutgoingMsg);



        // Status is special because it bypasses all the normal API stuff
        api.status = () => new Promise((resolve, reject) => {

            const switch_layer = layers[2];

            const status_request = new status_pb.status_request();

            switch_layer.sendOutgoingMsg(status_request);


            switch_layer.onIncomingStatusResponse = status_response => {

                resolve(status_response.toObject());

            };

        });


        // This one is also special
        api.publicKey = () => pub_from_priv(private_pem);


        api.close = () => layers[0].close();


        api.useFastestConnection = async () => {

            const stat = await api.status();

            const peer_index = JSON.parse(stat.moduleStatusJson).module[0].status.peer_index;


            const entries = peer_index.map(({host, port}) => 'ws://' + host + ':' + port);

            const connections = entries.map(entry => new Connection({entry, log}));

            const ps = connections.map(connection => 
                new Promise(resolve => {
                    connection.socket.addEventListener('open', () => resolve(connection))
                })
            );

            const best_connection = await Promise.race(ps);


            // Close out all other connections

            connections.filter(c => c !== best_connection).forEach(connection => 
                connection.readyState === 1 ? 

                    connection.close() : // In case two connections open very closely to one-another

                    connection.socket.onopen = () => connection.socket.close());


            // Replace existing connection with best connection

            layers[0].socket.close();
            
            layers[0] = best_connection;
            connect_layers(layers);


            // Return peer information

            const i = connections.indexOf(best_connection);

            return peer_index[i];

        };


        return api;

    },

    version: require('../package.json').version
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