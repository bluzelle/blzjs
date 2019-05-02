// Copyright (C) 2019 Bluzelle
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License, ver=on 3,
// as published by the Free Software Foundation.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


const bluzelle_pb = require('../../proto/bluzelle_pb');
const database_pb = require('../../proto/database_pb');
const status_pb = require('../../proto/status_pb');

const assert = require('assert');


const encode = string => new Uint8Array(Buffer.from(string, 'utf-8'));
const decode = binary => Buffer.from(binary).toString('utf-8');


module.exports = class API {

    constructor(sendOutgoingMsg) {

        this.sendOutgoingMsg = sendOutgoingMsg;

    }


    status() {

        return new Promise((resolve, reject) => {

            const status_request = new status_pb.status_request();

            this.sendOutgoingMsg(status_request, msg => {

                resolve(msg.toObject());

            }); 

        });

    }


    create(key, value, expire=0) {

        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const create = new database_pb.database_create();
            msg.setCreate(create);

            create.setKey(key);
            create.setValue(encode(value));
            create.setExpire(expire);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for create.");

                resolve();

                return true;

            });

        });

    }


    update(key, value, expire=0) {

        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof value === 'string', 'Value must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const update = new database_pb.database_update();
            msg.setUpdate(update);

            update.setKey(key);
            update.setValue(encode(value));
            update.setExpire(expire);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for update.");

                resolve();

                return true;

            });

        });

    }


    read(key) {

        assert(typeof key === 'string', 'Key must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const read = new database_pb.database_read();
            msg.setRead(read);

            read.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasRead(),
                    "A response other than error or read has been returned from daemon for read.");

                assert(incoming_msg.getRead().getKey() === key,
                    "Key in response does not match key in request for read.");

                resolve(decode(incoming_msg.getRead().getValue()));

                return true;

            });

        });

    }

    quickread(key) {

        assert(typeof key === 'string', 'Key must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const read = new database_pb.database_read();
            msg.setQuickRead(read);

            read.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                assert(incoming_msg.hasQuickRead(),
                    "A response other quickread has been returned from daemon for quickread.");


                if(incoming_msg.getQuickRead().getError() === '') {

                    assert(incoming_msg.getQuickRead().getKey() === key,
                        "Key in response does not match key in request for read.");

                    resolve(decode(incoming_msg.getQuickRead().getValue()));

                } else {

                    reject(new Error(incoming_msg.getQuickRead().getError()));

                }


                return true;

            });

        });

    }

    delete(key) {

        assert(typeof key === 'string', 'Key must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const _delete = new database_pb.database_delete();
            msg.setDelete(_delete);

            _delete.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for update.");

                resolve();

                return true;

            });

        });

    }


    has(key) {

        assert(typeof key === 'string', 'Key must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const has = new database_pb.database_has();
            msg.setHas(has);

            has.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasHas(),
                    "A response other than error or has has been returned from daemon for has.");

                assert(incoming_msg.getHas().getKey() === key,
                    "Key in response does not match key in request for has.");

                resolve(incoming_msg.getHas().getHas());

                return true;

            });

        });

    }


    keys() {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const keys = new database_pb.database_request();
            msg.setKeys(keys);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasKeys(),
                    "A response other than error or keys has been returned from daemon for keys.");

                resolve(incoming_msg.getKeys().getKeysList());

                return true;

            });

        });

    }


    size() {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const size = new database_pb.database_request();
            msg.setSize(size);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasSize(),
                    "A response other than size has been returned from daemon for size.");

                resolve({
                    bytes: incoming_msg.getSize().getBytes(),
                    keys: incoming_msg.getSize().getKeys(),
                    remainingBytes: incoming_msg.getSize().getRemainingBytes(),
                });

                return true;

            });

        });

    }


    expire(key, expire) {

        assert(typeof key === 'string', 'Key must be a string');
        assert(typeof expire === 'number', 'Expiry must be a number');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const expire_ = new database_pb.database_expire();
            msg.setExpire(expire_);

            expire_.setKey(key);
            expire_.setExpire(expire.toString());


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for expire.");

                resolve();

                return true;

            });

        });

    }


    persist(key) {

        assert(typeof key === 'string', 'Key must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const read = new database_pb.database_read();
            msg.setPersist(read);

            read.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for persist.");

                resolve();

                return true;

            });

        });

    }


    ttl(key) {

        assert(typeof key === 'string', 'Key must be a string');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const read = new database_pb.database_read();
            msg.setTtl(read);
            read.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasTtl(),
                    "A response other than error or ttl has been returned from daemon for ttl.");

                assert(incoming_msg.getTtl().getKey() === key,
                    "Key in response does not match key in request for ttl.");

                resolve(incoming_msg.getTtl().getTtl());

                return true;

            });

        });

    }


    createDB(maxsize=0, policy_type='none') {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const createDB = new database_pb.database_create_db();

            createDB.setMaxSize(maxsize);

            const x = policy_type === 'random' ? database_pb.database_create_db.eviction_policy_type.RANDOM :
                      database_pb.database_create_db.eviction_policy_type.NONE;

            createDB.setEvictionPolicy(x);


            msg.setCreateDb(createDB);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for createDB.");

                resolve();

                return true;

            });

        });

    }


    updateDB(maxsize=0, policy_type='none') {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const createDB = new database_pb.database_create_db();

            createDB.setMaxSize(maxsize);

            const x = policy_type === 'random' ? database_pb.database_create_db.eviction_policy_type.RANDOM :
                      database_pb.database_create_db.eviction_policy_type.NONE;

            createDB.setEvictionPolicy(x);


            msg.setUpdateDb(createDB);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for updateDB.");

                resolve();

                return true;

            });

        });

    }


    deleteDB() {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const _delete = new database_pb.database_request();
            msg.setDeleteDb(_delete);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for createDB.");

                resolve();

                return true;

            });

        });

    }


    hasDB() {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const has = new database_pb.database_has_db();
            msg.setHasDb(has);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasHasDb(),
                    "A response other than error or ack has been returned from daemon for createDB.");

                const resp = incoming_msg.getHasDb();

                resolve(resp.getHas());

                return true;

            });

        });

    }


    _getWriters() {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const req = new database_pb.database_request();
            msg.setWriters(req);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasWriters(),
                    "A response other than writers has been returned from daemon for writers.");

                const resp = incoming_msg.getWriters();

                resolve({
                    owner: resp.getOwner(),
                    writers: resp.getWritersList()
                });

                return true;

            });

        });

    }


    _addWriters(writers) {

        assert(typeof writers === 'string' || (Array.isArray(writers) && writers.every(writer => typeof writer === 'string')),
            'Writers must be a string or an array of strings');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const writers_msg = new database_pb.database_writers();
            writers_msg.setWritersList(Array.isArray(writers) ? writers : [writers]);

            msg.setAddWriters(writers_msg);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for addWriters.");

                resolve();

                return true;

            });

        });

    }


    _deleteWriters(writers) {

        assert(typeof writers === 'string' || (Array.isArray(writers) && writers.every(writer => typeof writer === 'string')),
            'Writers must be a string or an array of strings');

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();


            const writers_msg = new database_pb.database_writers();
            writers_msg.setWritersList(Array.isArray(writers) ? writers : [writers]);

            msg.setRemoveWriters(writers_msg);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.getResponseCase() === 0,
                    "A response other than error or ack has been returned from daemon for removeWriters.");

                resolve();

                return true;

            });

        });

    }


};