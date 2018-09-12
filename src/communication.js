const WebSocket = require('isomorphic-ws');
const {encode} = require('base64-arraybuffer');
const {isEqual} = require('lodash');
const bluzelle_pb = require('../proto/bluzelle_pb');


const tidMap = new Map();

const primaryConnection = {};
const secondaryConnection = {};


const connect = address => {

    if(primaryConnection.socket && primaryConnection.socket.readyState === 1) {

        return Promise.reject(new Error('bluzelle: already connected.'));

    }


    return newConnection(address, onMessage, primaryConnection);

};


const disconnect = () => {

    primaryConnection.socket && primaryConnection.socket.close();
    secondaryConnection.socket && secondaryConnection.socket.close();

    delete primaryConnection.socket;
    delete secondaryConnection.socket;

};


const newConnection = (address, handleMessage, connectionObject = {}) => 
    new Promise((resolve, reject) => {

    connectionObject.address = address;

    connectionObject.socket = new WebSocket(address);
    connectionObject.socket.binaryType = "arraybuffer";

    connectionObject.socket.onopen = () => resolve();

    connectionObject.socket.onerror = (e) =>
        reject(new Error(e.error.message));

    connectionObject.socket.onmessage = e =>
        handleMessage(e.data);

});



const onMessage = bin => {    

    if(typeof bin === 'string') {
        throw new Error('daemon returned string instead of binary')
    }


    const response = bluzelle_pb.database_response.deserializeBinary(new Uint8Array(bin));
    const response_json = response.toObject();

    // console.log("\nRecieving\n",response_json);

    const id = response_json.header.transactionId;


    if(id === undefined) {
        throw new Error('Received non-response_json message.');
    }


    const o = tidMap.get(id);

    tidMap.delete(o);


    if(response_json.redirect) {

        const prefix = 'ws://';

        const addressAndPort = prefix + response_json.redirect.leaderHost + ':' + response_json.redirect.leaderPort;


        // Find a way to check if this address is going to the same node.

        newConnection(addressAndPort, onMessage, secondaryConnection).then(
            () => console.log("New connection baby") || sendSecondary(o.database_msg).then(o.resolve, o.reject),
            o.reject
        );

        
    } else {

        if(response.hasError()) {

            o.reject(new Error(response.getError().getMessage()));

        } else {

            resolve(response_json, response, o);

        }

    }

};


const resolve = (response_json, response, o) => {

    // We want the raw binary output, as toObject() above will automatically
    // convert the Uint8 array to base64.

    if(response_json && response_json.read) {

        response_json.read.value = response.getRead().getValue();

    }


    if(response_json && response_json.subscriptionUpdate) {

        response_json.subscriptionUpdate.value = 
            response.getSubscriptionUpdate().getValue();

    }

    
    o.resolve(response_json || {});

};


const send = (database_msg, socket) => new Promise((resolve, reject) => {

    const message = new bluzelle_pb.bzn_msg();

    message.setDb(database_msg);

    const tid = database_msg.getHeader().getTransactionId();


    // console.log("\nSending\n", database_msg.toObject());


    tidMap.set(tid, {
        resolve,
        reject,
        database_msg
    });

    socket.send(JSON.stringify({
        'bzn-api': 'database',
        msg: encode(message.serializeBinary())
    }));

});


const sendPrimary = database_msg => 

    send(database_msg, primaryConnection.socket);


const sendSecondary = database_msg => {

    if(secondaryConnection.socket) {

        return send(database_msg, secondaryConnection.socket);

    } else {

        return sendPrimary(database_msg);

    }


};


const sendObserver = (database_msg, observer) => {

    // This function replaces the resolver and then calls the observer,
    // as the resolver is automatically deleted after it resolves.

    const persistResolver = v => {

        const tid = database_msg.getHeader().getTransactionId();

        tidMap.set(tid, {
            resolve: persistResolver,
            reject: () => {},
            db_message: {}
        });


        v.subscriptionUpdate && observer(v.subscriptionUpdate.value);

        return tid;

    };


    return sendPrimary(database_msg).then(persistResolver);

};



module.exports = {
    connect,
    disconnect,
    sendPrimary,
    sendSecondary,
    sendObserver
};

