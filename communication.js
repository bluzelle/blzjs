const WebSocket = require('isomorphic-ws');
const bluzelle_pb = require('./bluzelle_pb');
const database_pb = require('./database_pb');
const {encode} = require('base64-arraybuffer');
const {isEqual} = require('lodash');


const connections = new Set();
const resolvers = new Map();
const rejecters = new Map();
const messages = new Map();



let uuid;
let address;

const connect = (addr, id) => {
    uuid = id;
    address = addr;
};


const onMessage = (bin, socket) => {

    const response = database_pb.database_response.deserializeBinary(new Uint8Array(bin));
    const response_json = response.toObject();

    const id = response_json.header.transactionId;

    const message = messages.get(id);
    const resolver = resolvers.get(id);
    const rejecter = rejecters.get(id);

    resolvers.delete(id);
    rejecters.delete(id);
    messages.delete(id);

    if(id === undefined) {

        throw new Error('Received non-response_json message.');

    }

    if(response_json.redirect) {

        const isSecure = address.startsWith('wss://');

        const prefix = isSecure ? 'wss://' : 'ws://';

        const addressAndPort = prefix + response_json.redirect.leaderHost + ':' + response_json.redirect.leaderPort;

        connect(addressAndPort, uuid);

        send(message, resolver, rejecter);


    } else {

        // We want the raw binary output, as toObject() above will automatically
        // convert the Uint8 array to base64.

        if(response_json.resp && response_json.resp.value) {

            response_json.resp.value = response.getResp().getValue();

        }


        resolver(response_json.resp || {});

    }

};


const getTransactionId = (() => {

    let counter = 0;

    return () => counter++;

})();


const send = (database_msg, resolver, rejecter) => {

    const message = new bluzelle_pb.bzn_msg();

    message.setDb(database_msg);

    const tid = database_msg.getHeader().getTransactionId();

    resolvers.set(tid, resolver);
    rejecters.set(tid, rejecter);
    messages.set(tid, database_msg);


    const s = new WebSocket(address);

    s.onopen = () => {

        s.send(JSON.stringify({
            'bzn-api': 'database',
            msg: encode(message.serializeBinary())
        }));

    };

    s.onerror = e =>  {

        s.close();
        rejecter(e);

    };

    s.onmessage = e => {
        onMessage(e.data, s);
        s.close();
    };

};



// Non-polling actions

const read = key => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();
    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);

    const database_read = new bluzelle_pb.database_read();

    database_read.setKey(key);

    database_msg.setRead(database_read);


    send(database_msg, obj => 
        obj.error ? reject(new Error(obj.error)) : resolve(obj.value), reject);

});


const has = key => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();
    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);

    const database_has = new bluzelle_pb.database_has();

    database_has.setKey(key);

    database_msg.setHas(database_has);


    send(database_msg, obj => 
        obj.error ? reject(new Error(obj.error)) : resolve(obj.has), reject);

});


const keys = () => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();
    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);

    const database_empty = new bluzelle_pb.database_empty();

    database_msg.setKeys(database_empty);


    send(database_msg, obj => 
        obj.error ? reject(new Error(obj.error)) : resolve(obj.keysList), reject);

});

const size = () => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();
    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);

    const database_empty = new bluzelle_pb.database_empty();

    database_msg.setSize(database_empty);


    send(database_msg, obj => 
        obj.error ? reject(new Error(obj.error)) : resolve(obj.size), reject);

});





const poll = action => new Promise((resolve, reject) => {

    const pollRate = 500; // ms
    const pollTimeout = 5000;

    const start = new Date().getTime();


    (function loop() {

        action().then(v => {

            if(v) {

                resolve();

            } else {

                if(new Date().getTime() - start > pollTimeout) {

                    reject(new Error('Bluzelle poll timeout - command not commited to swarm.'));

                } else {

                    setTimeout(loop, pollRate);

                }

            }

        }, reject);

    })();

});


// Polling actions

const update = (key, value) => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();

    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);


    const database_update = new database_pb.database_update();

    database_update.setKey(key);

    database_update.setValue(value);


    database_msg.setUpdate(database_update);


    send(database_msg, obj => {

        if(obj.error) {

            reject(new Error(obj.error));

        } else {

            const pollingFunc = () => 
                new Promise((res, rej) => 
                    read(key).then(v => res(isEqual(v, value)), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    }, reject);

});


const create = (key, value) => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();

    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);


    const database_create = new database_pb.database_create();

    database_create.setKey(key);

    database_create.setValue(value);


    database_msg.setCreate(database_create);


    send(database_msg, obj => {

        if(obj.error) {

            reject(new Error(obj.error));

        } else {

            const pollingFunc = () => 
                new Promise((res, rej) => 
                    has(key).then(v => res(v), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    }, reject);

});



const remove = key => new Promise((resolve, reject) => {

    const database_msg = new database_pb.database_msg();

    const header = new database_pb.database_header();

    header.setDbUuid(uuid);
    header.setTransactionId(getTransactionId());

    database_msg.setHeader(header);


    const database_delete = new database_pb.database_delete();

    database_delete.setKey(key);

    database_msg.setDelete(database_delete);


    send(database_msg, obj => {

        if(obj.error) {

            reject(new Error(obj.error));

        } else {

            const pollingFunc = () => 
                new Promise((res, rej) => 
                    has(key).then(v => res(!v), rej));

            poll(pollingFunc).then(resolve, reject);

        }

    }, reject);

});


module.exports = {
    getUuid: () => uuid,
    connect,
    create,
    read,
    update,
    remove,
    has,
    keys,
    size
};


