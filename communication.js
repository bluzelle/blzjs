const WebSocket = require('isomorphic-ws');
const assert = require('assert');

const connections = new Set();
const resolvers = new Map();
const messages = new Map();


// const ping = () => new Promise(resolve => {

//     send({
//         cmd: 'ping',
//         'bzn-api': 'ping'
//     }, obj => resolve());

// });


let uuid;
let address;

const connect = (addr, id) => {
    uuid = id;
    address = addr;

    return Promise.resolve();

};


const onMessage = (event, socket) => {

    const request = messages.get(event['response-to']);
    const resolver = resolvers.get(event['response-to']);

    resolvers.delete(event['response-to']);
    messages.delete(event['response-to']);


    if(event['response-to'] === undefined) {

        throw new Error('Received non-response message.');

    }

    if(event.error && event.error === 'NOT_THE_LEADER') {

        const addressAndPort = 'ws://' + event.data['leader-url'] + ':' + event.data['leader-port'];

        connect(addressAndPort, uuid).then(() => {

            send(request, resolver);

        });

    } else {

        resolver(event);

    }

};



// const disconnect = () => 
//     Promise.all(Array.from(connections).map(con => 
//         new Promise(resolve => {

//         con.onclose = () => {

//             connections.delete(con);
//             resolve();

//         };

//         con.close();

//     })));


const amendBznApi = obj =>
    Object.assign(obj, {
        'bzn-api': 'crud'
    });

const amendUuid = (uuid, obj) =>
    Object.assign(obj, {
        'db-uuid': uuid
    });


const amendRequestID = (() => {

    let requestIDCounter = 0;

    return obj =>
        Object.assign(obj, {
            'request-id': requestIDCounter++
        });

})();


const send = (obj, resolver) => {

    const message = amendUuid(uuid , amendRequestID(obj));
    resolvers.set(message['request-id'], resolver);
    messages.set(message['request-id'], message);


    const s = new WebSocket(address);

    s.onopen = () => {

        s.send(JSON.stringify(message));

    };

    s.onerror = e =>  {

        s.close();
        console.error(e);

    };

    s.onmessage = e => {
        onMessage(JSON.parse(e.data), s);
        s.close();
    };

};


const update = (key, value) => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'update',
        data: {
            key, value
        }
    });

    send(cmd, obj =>
        obj.error ? reject(new Error(obj.error)) : resolve());

});


const create = (key, value) => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'create',
        data: {
            key, value
        }
    });

    send(cmd, obj =>
        obj.error ? reject(new Error(obj.error)) : resolve());

});



const remove = key => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'delete',
        data: {
            key
        }
    });


    send(cmd, obj =>
        obj.error ? reject(new Error(obj.error)) : resolve());

});


const read = key => new Promise((resolve, reject) => {

    const cmd = amendBznApi({
        cmd: 'read',
        data: {
            key
        }
    });


    send(cmd, obj =>
        obj.error ? reject(new Error(obj.error)) : resolve(obj.data.value));

});


const has = key => new Promise(resolve => {

    const cmd = amendBznApi({
        cmd: 'has',
        data: {
            key
        }
    });


    send(cmd, obj => resolve(obj.data.value));

});


const keys = () => new Promise(resolve => {

    const cmd = amendBznApi({
        cmd: 'keys'
    });

    send(cmd, obj => resolve(obj.data.value));

});



module.exports = {
    getUuid: () => uuid,
    connect,
    create,
    read,
    update,
    remove,
    has,
    keys
};


