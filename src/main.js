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
const Redirect = require('./3_redirect_layer');
const Cache = require('./4_cache_layer');
const Metadata = require('./6_metadata_layer');
const API = require('./7_api_layer');


module.exports = ({entry, private_pem, uuid}) => {

    const layers = [
        new Connection({ entry, log: true }),
        new Crypto({ private_pem, }),        
        new Redirect({}),
        new Cache({}),
        new Metadata({ uuid, }),
    ];

    const sandwich = connect_layers(layers);

    api = new API(sandwich.sendOutgoingMsg);


    return api;

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