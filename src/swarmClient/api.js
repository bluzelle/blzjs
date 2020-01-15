//
// Copyright (C) 2019 Bluzelle
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


// const bluzelle_pb = require('../../proto/bluzelle_pb');
// const database_pb = require('../../proto/database_pb');
// const status_pb = require('../../proto/status_pb');

const assert = require('assert');
const cosmos = require('./cosmos');
//import {request_type} from './cosmos';


const encode = string => new Uint8Array(Buffer.from(string, 'utf-8'));
const decode = binary => Buffer.from(binary).toString('utf-8');

//const pub_key = "cosmos1kuhpeq7enqq36zzlwewpangf9uxkgpktxr463r";

// TODO: allow specification of private key somehow
const def_mnemonic = "";



// returns a normal promise with a default timeout
// and a method .timeout(t) that can customize the time
// when t=0, the timeout is indefinite

// const timeout_promise = f => {
//
//     const default_timeout = 500000;
//
//
//     const nullify_error = p => p.catch(() => {});
//     const unnullify_error = p => new Promise((a, b) => p.then(a, b));
//
//
//     const timeout = t =>
//         Promise.race([
//             p,
//             new Promise((_, rej) =>
//                 setTimeout(() =>
//                     rej(new Error('operation timed out after ' + t + 'ms')), t))
//         ]);
//
//
//     const p = new Promise(f);
//     nullify_error(p);
//
//     const p2 = timeout(default_timeout);
//
//     p2.timeout = t => {
//
//         nullify_error(p2);
//
//         return t === 0 ? unnullify_error(p) : timeout(t);
//
//     };
//
//     return p2;
//
// };

function hex2string(hex)
{
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

module.exports = class API {

    constructor(address, mnemonic, uuid, chain_id/*, ...args*/)
    {
        this.mnemonic = mnemonic || def_mnemonic;
        this.address = address;
        this.uuid = uuid;
        this.chain_id = chain_id || "bluzelle";
    }

    async init()
    {
        return await cosmos.init(this.mnemonic);
    }

    status()
    {
        console.log("status");
    }

    async create(key, value, expire=0)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        const data = {
            BaseReq:{
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Value: value,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject)=>
        {
            cosmos.send_transaction('post', 'create', data).then(function(res)
            {
                resolve({Result: res.data.logs[0].success});
            })
            .catch(function(err)
            {
                reject(err);
            });
        });
    }


    async update(key, value, expire=0)
    {
        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        const data = {
            BaseReq:{
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Value: value,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject)=>
        {
            cosmos.send_transaction('post', 'update', data).then(function(res)
            {
                resolve({Result: res.data.logs[0].success});
            })
            .catch(function(err)
            {
                reject(err);
            });
        });
    }

    async quickread(key)
    {
        assert(typeof key === 'string', 'Key must be a string');
        return cosmos.query(`read/${this.uuid}/${key}`);
    }

    async read(key)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const uuid = this.uuid;
        const data = {
            BaseReq:{
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: uuid,
            Key: key,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject)=>
        {
            cosmos.send_transaction('post', 'read', data).then(function(res)
            {
                resolve({
                    UUID: uuid,
                    Key: key,
                    Value: hex2string(res.data.data)
                });

            }).catch(function(err)
            {
                reject(err);
            });
        });
    }

    async delete(key)
    {
        assert(typeof key === 'string', 'Key must be a string');

        const data = {
            BaseReq:{
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: this.uuid,
            Key: key,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject)=>
        {
            cosmos.send_transaction('delete', 'delete', data).then(function (res) {
                resolve({Result: res.data.logs[0].success});
            })
                .catch(function (err) {
                    reject(err);
                });
        });
    }

    async quickhas(key)
    {
        assert(typeof key === 'string', 'Key must be a string');
        return cosmos.query(`has/${this.uuid}/${key}`);
    }


    has(key) {
        assert(typeof key === 'string', 'Key must be a string');

        const uuid = this.uuid;
        const data = {
            BaseReq:{
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: uuid,
            Key: key,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject)=>
        {
            cosmos.send_transaction('post', 'has', data).then(function(res)
            {
                resolve({
                    UUID: uuid,
                    Key: key,
                    Value: hex2string(res.data.data)
                });

            }).catch(function(err)
            {
                reject(err);
            });
        });
    }


    async quickkeys()
    {
        return cosmos.query(`keys/${this.uuid}`);
    }


    keys() {
        const uuid = this.uuid;
        const data = {
            BaseReq:{
                from: this.address,
                chain_id: this.chain_id
            },
            UUID: uuid,
            Owner: this.address,
        };

        return new Promise(async (resolve, reject)=>
        {
            cosmos.send_transaction('post', 'keys', data).then(function(res)
            {
                resolve({
                    UUID: uuid,
                    Key: key,
                    Value: hex2string(res.data.data)
                });

            }).catch(function(err)
            {
                reject(err);
            });
        });
    }


    //
    // size() {
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const size = new database_pb.database_request();
    //         msg.setSize(size);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.hasSize(),
    //                 "A response other than size has been returned from daemon for size.");
    //
    //             resolve({
    //                 bytes: incoming_msg.getSize().getBytes(),
    //                 keys: incoming_msg.getSize().getKeys(),
    //                 remainingBytes: incoming_msg.getSize().getRemainingBytes(),
    //             });
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // expire(key, expire) {
    //
    //     assert(typeof key === 'string', 'Key must be a string');
    //     assert(typeof expire === 'number', 'Expiry must be a number');
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const expire_ = new database_pb.database_expire();
    //         msg.setExpire(expire_);
    //
    //         expire_.setKey(key);
    //         expire_.setExpire(expire.toString());
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for expire.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // persist(key) {
    //
    //     assert(typeof key === 'string', 'Key must be a string');
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const read = new database_pb.database_read();
    //         msg.setPersist(read);
    //
    //         read.setKey(key);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for persist.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // ttl(key) {
    //
    //     assert(typeof key === 'string', 'Key must be a string');
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const read = new database_pb.database_read();
    //         msg.setTtl(read);
    //         read.setKey(key);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.hasTtl(),
    //                 "A response other than error or ttl has been returned from daemon for ttl.");
    //
    //             assert(incoming_msg.getTtl().getKey() === key,
    //                 "Key in response does not match key in request for ttl.");
    //
    //             resolve(incoming_msg.getTtl().getTtl());
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _createDB(maxsize=0, policy_type='none') {
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const createDB = new database_pb.database_create_db();
    //
    //         createDB.setMaxSize(maxsize);
    //
    //         const x = policy_type === 'random' ? database_pb.database_create_db.eviction_policy_type.RANDOM :
    //                   database_pb.database_create_db.eviction_policy_type.NONE;
    //
    //         createDB.setEvictionPolicy(x);
    //
    //
    //         msg.setCreateDb(createDB);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for createDB.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _updateDB(maxsize=0, policy_type='none') {
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const createDB = new database_pb.database_create_db();
    //
    //         createDB.setMaxSize(maxsize);
    //
    //         const x = policy_type === 'random' ? database_pb.database_create_db.eviction_policy_type.RANDOM :
    //                   database_pb.database_create_db.eviction_policy_type.NONE;
    //
    //         createDB.setEvictionPolicy(x);
    //
    //
    //         msg.setUpdateDb(createDB);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for updateDB.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _deleteDB() {
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const _delete = new database_pb.database_request();
    //         msg.setDeleteDb(_delete);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for createDB.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _hasDB() {
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const has = new database_pb.database_has_db();
    //         msg.setHasDb(has);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.hasHasDb(),
    //                 "A response other than error or ack has been returned from daemon for createDB.");
    //
    //             const resp = incoming_msg.getHasDb();
    //
    //             resolve(resp.getHas());
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _getWriters() {
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const req = new database_pb.database_request();
    //         msg.setWriters(req);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.hasWriters(),
    //                 "A response other than writers has been returned from daemon for writers.");
    //
    //             const resp = incoming_msg.getWriters();
    //
    //             resolve({
    //                 owner: resp.getOwner(),
    //                 writers: resp.getWritersList()
    //             });
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _addWriters(writers) {
    //
    //     assert(typeof writers === 'string' || (Array.isArray(writers) && writers.every(writer => typeof writer === 'string')),
    //         'Writers must be a string or an array of strings');
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //         const writers_msg = new database_pb.database_writers();
    //         writers_msg.setWritersList(Array.isArray(writers) ? writers : [writers]);
    //
    //         msg.setAddWriters(writers_msg);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for addWriters.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }
    //
    //
    // _deleteWriters(writers) {
    //
    //     assert(typeof writers === 'string' || (Array.isArray(writers) && writers.every(writer => typeof writer === 'string')),
    //         'Writers must be a string or an array of strings');
    //
    //     return timeout_promise((resolve, reject) => {
    //
    //         const msg = new database_pb.database_msg();
    //
    //
    //         const writers_msg = new database_pb.database_writers();
    //         writers_msg.setWritersList(Array.isArray(writers) ? writers : [writers]);
    //
    //         msg.setRemoveWriters(writers_msg);
    //
    //
    //         this.sendOutgoingMsg(msg, incoming_msg => {
    //
    //             if(incoming_msg.hasError()) {
    //
    //                 reject(new Error(incoming_msg.getError().getMessage()));
    //                 return true;
    //
    //             }
    //
    //             assert(incoming_msg.getResponseCase() === 0,
    //                 "A response other than error or ack has been returned from daemon for removeWriters.");
    //
    //             resolve();
    //
    //             return true;
    //
    //         });
    //
    //     });
    //
    // }


};
