// Copyright (C) 2018 Bluzelle
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


const database_pb = require('../proto/database_pb');
const assert = require('assert');


const encode = string => new Uint8Array(Buffer.from(string, 'utf-8'));
const decode = binary => Buffer.from(binary).toString('utf-8');


module.exports = class API {

    constructor(sendOutgoingMsg) {

        this.sendOutgoingMsg = sendOutgoingMsg;

    }


    create(key, value) {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const create = new database_pb.database_create();
            msg.setCreate(create);

            create.setKey(key);
            create.setValue(encode(value));


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


    update(key, value) {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const update = new database_pb.database_update();
            msg.setUpdate(update);

            update.setKey(key);
            update.setValue(encode(value));


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

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const read = new database_pb.database_read();
            msg.setQuickRead(read);

            read.setKey(key);


            this.sendOutgoingMsg(msg, incoming_msg => {

                if(incoming_msg.hasError()) {

                    reject(new Error(incoming_msg.getError().getMessage()));
                    return true;

                }

                assert(incoming_msg.hasRead(),
                    "A response other than error or read has been returned from daemon for quickread.");

                assert(incoming_msg.getRead().getKey() === key,
                    "Key in response does not match key in request for read.");

                resolve(decode(incoming_msg.getRead().getValue()));

                return true;

            });

        });

    }

    delete(key) {

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

                resolve(incoming_msg.getSize().getBytes());

                return true;

            });

        });

    }


    createDB() {

        return new Promise((resolve, reject) => {

            const msg = new database_pb.database_msg();

            const create = new database_pb.database_request();
            msg.setCreateDb(create);


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


    getWriters() {

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


    addWriters(writers) {

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


    deleteWriters(writers) {

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