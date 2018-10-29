const {valToUInt8, uInt8ToVal} = require('./serialize');
const {encode} = require('base64-arraybuffer');
const {isEqual} = require('lodash');
const bluzelle_pb = require('../proto/bluzelle_pb');
const waitUntil = require('async-wait-until');
const WebSocket = require('isomorphic-ws');


const newConnection = (client, address, connectionObject = {}) => 
   
    new Promise((resolve, reject) => {


    connectionObject.address = address;

    connectionObject.socket = new WebSocket(address);
    connectionObject.socket.binaryType = "arraybuffer";

    connectionObject.socket.onopen = () => resolve();

    connectionObject.socket.onerror = (e) =>
        reject("Websocket connection error");

    connectionObject.socket.onmessage = e =>
        onMessage(client, e.data);

});


const onMessage = (client, bin) => {    

    if(typeof bin === 'string') {
        throw new Error('Bluzelle: (internal) daemon returned string instead of binary.')
    }


    let response;

    try {
        response = bluzelle_pb.database_response.deserializeBinary(new Uint8Array(bin));
    } catch(e) {
        throw new Error('bluzelle: protobuf assertion error (probably mismatched client-daemon protobuf files)');
    }

    const response_json = response.toObject();


    client.logger && 
        setTimeout(() => client.logger("Receiving", response_json), 0);



    if(!response.hasHeader() && response.hasError()) {

        throw new Error(response.getError().getMessage());
        return;

    }


    const id = response_json.header.transactionId;


    if(id === undefined) {
        throw new Error('Bluzelle: (internal) received non-response_json message.');
    }


    const o = client.tidMap.get(id);
    client.tidMap.delete(o);


    if(response_json.redirect) {

        const prefix = 'ws://';

        const addressAndPort = prefix + response_json.redirect.leaderHost + ':' + response_json.redirect.leaderPort;


        // Find a way to check if this address is going to the same node.

        newConnection(client, addressAndPort, client.secondaryConnection).then(
            () => sendSecondary(client, o.database_msg).then(o.resolve, o.reject),
            () => o.reject()
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

        response_json.read.value = response.getRead().getValue_asU8();

    }


    if(response_json && response_json.subscriptionUpdate) {

        response_json.subscriptionUpdate.value = 
            response.getSubscriptionUpdate().getValue_asU8();


        // Set the value to undefined if it has been deleted.
        // This propagates through the deserialization and remains undefined to the user.

        if(response.getSubscriptionUpdate().getOperation() === proto.database_subscription_update.operation_type.DELETE) {
            response_json.subscriptionUpdate.value = undefined;
        }

    }

    
    o.resolve(response_json || {});

};


const send = (client, database_msg, socket) => 

    new Promise((resolve, reject) => {


    const message = new bluzelle_pb.bzn_msg();

    message.setDb(database_msg);

    const tid = database_msg.getHeader().getTransactionId();


    client.logger && 
        setTimeout(() => client.logger("Sending", database_msg.toObject()), 0);


    let serializedMessage;

    try {

        serializedMessage = message.serializeBinary();

    } catch(e) {

        reject(new Error("Bluzelle: (internal) protobuf serialization failed."));

    }


    client.tidMap.set(tid, {
        resolve,
        reject,
        database_msg
    });

    socket.send(JSON.stringify({
        'bzn-api': 'database',
        msg: encode(serializedMessage)
    }));

});


const sendPrimary = (client, database_msg) => {

    if(!client.primaryConnection.socket) {

        return Promise.reject(new Error(
            "Bluzelle: attempting to send message with no connection."));

    }

    return send(client, database_msg, client.primaryConnection.socket);

};


// Attempts to send to the secondary connection and otherwise
// defaults to the primary.

const sendSecondary = (client, database_msg) => {

    if(client.secondaryConnection.socket) {

        return send(client, database_msg, client.secondaryConnection.socket);

    } else {

        return sendPrimary(client, database_msg);

    }


};


const sendObserver = (client, database_msg, observer) => {

    // This function replaces the resolver and then calls the observer,
    // as the resolver is automatically deleted after it resolves.

    const persistResolver = v => {

        const tid = database_msg.getHeader().getTransactionId();

        client.tidMap.set(tid, {
            resolve: persistResolver,
            reject: () => {},
            db_message: {}
        });


        v.subscriptionUpdate && observer(v.subscriptionUpdate.value);

        return tid;

    };


    return sendPrimary(client, database_msg).then(persistResolver);

};



const generateTransactionId = client => {

    client._counter = client._counter || 0;

    return client._counter++;

};


const getMessagePrototype = client => {

    const database_msg = new bluzelle_pb.database_msg();
    const header = new bluzelle_pb.database_header();

    header.setDbUuid(client.uuid);

    header.setTransactionId(generateTransactionId(client));

    database_msg.setHeader(header);

    return database_msg;

};



class BluzelleClient {

    constructor(entrypoint, uuid, log) {

        this.entrypoint = entrypoint;
        this.uuid = uuid;


        // Print requests and responses
        if(log === true) {
            this.logger = (...args) => console.log(...args);
        }

        if(typeof log === 'function') {
            this.logger = log;
        }


        this.primaryConnection = {};
        this.secondaryConnection = {};


        // For mapping transaction ids to their resolvers

        this.tidMap = new Map();


        // For mapping subscription transaction ids to
        // their keys.

        this.tidToKey = new Map();


        // Transaction ID counter.

        this._counter = 0;

    }


    connect() {

        if(this.primaryConnection.socket && this.primaryConnection.socket.readyState === 1) {

            return Promise.reject(new Error('bluzelle: already connected.'));

        }


        return newConnection(this, this.entrypoint, this.primaryConnection);

    }


    disconnect() {

        this.primaryConnection.socket 
            && this.primaryConnection.socket.close();

        this.secondaryConnection.socket 
            && this.secondaryConnection.socket.close();

        delete this.primaryConnection.socket;
        delete this.secondaryConnection.socket;

    }


    // Read-style functions

    read(key) {

        const database_msg = getMessagePrototype(this);

        const database_read = new bluzelle_pb.database_read();

        database_read.setKey(key);

        database_msg.setRead(database_read);


        return sendPrimary(this, database_msg).then(o => o.read.value).then(uInt8ToVal);

    }


    has(key) {

        const database_msg = getMessagePrototype(this);

        const database_has = new bluzelle_pb.database_has();

        database_has.setKey(key);

        database_msg.setHas(database_has);


        return sendPrimary(this, database_msg).then(o => o.has.has);

    }


    keys() {

        const database_msg = getMessagePrototype(this);

        const database_empty = new bluzelle_pb.database_request();

        database_msg.setKeys(database_empty);


        return sendPrimary(this, database_msg).then(o => o.keys.keysList);

    }


    size() {

        const database_msg = getMessagePrototype(this);

        const database_empty = new bluzelle_pb.database_request();

        database_msg.setSize(database_empty);


        return sendPrimary(this, database_msg).then(o => o.size.bytes);

    }



    // Write-style functions

    updateAck(key, value) {

        const database_msg = getMessagePrototype(this);

        const database_update = new bluzelle_pb.database_update();

        database_update.setKey(key);

        database_update.setValue(valToUInt8(value));

        database_msg.setUpdate(database_update);


        return sendSecondary(this, database_msg);

    }


    createAck(key, value) {

        const database_msg = getMessagePrototype(this);

        const database_create = new bluzelle_pb.database_create();

        database_create.setKey(key);

        database_create.setValue(valToUInt8(value));

        database_msg.setCreate(database_create);


        return sendSecondary(this, database_msg);

    }


    removeAck(key) {

        const database_msg = getMessagePrototype(this);

        const database_delete = new bluzelle_pb.database_delete();

        database_delete.setKey(key);

        database_msg.setDelete(database_delete);


        return sendSecondary(this, database_msg);

    }



    // Subscription


    subscribe(key, observer) {

        const database_msg = getMessagePrototype(this);

        const database_subscribe = new bluzelle_pb.database_subscribe();

        database_subscribe.setKey(key);

        database_msg.setSubscribe(database_subscribe);


        this.tidToKey.set(
            database_msg.getHeader().getTransactionId(),
            key);


        return sendObserver(this, database_msg, v => observer(uInt8ToVal(v)));

    }


    unsubscribe(tid) {

        const database_msg = getMessagePrototype(this);

        const database_unsubscribe = new bluzelle_pb.database_unsubscribe();


        const key = this.tidToKey.get(tid);


        database_unsubscribe.setKey(key);
        database_unsubscribe.setTransactionId(tid);

        database_msg.setUnsubscribe(database_unsubscribe);


        return sendPrimary(this, database_msg).then(() => 

            this.tidToKey.delete(tid));

    };


    async _subscriptionAction(key, value, action) {

        let v;
        let set;

        const s = await this.subscribe(key, v2 => { set = true; v = v2; });

        await action();

        await waitUntil(() => set === true && v === value);

        await this.unsubscribe(s);

    }


    // Composite functions

    create(key, value) {

        return this._subscriptionAction(key, value, 
            () => this.createAck(key, value));

    }


    update(key, value) {

        return this._subscriptionAction(key, value,
            () => this.updateAck(key, value));

    }


    remove(key) { 

        return this._subscriptionAction(key, undefined,
            () => this.removeAck(key));

    }

}



module.exports = {

    BluzelleClient

};