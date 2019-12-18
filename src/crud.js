#!/usr/bin/node

const { bluzelle } = require('bluzelle');

const main = async () => {

    bz = await bluzelle({
        address: 'cosmos1cqcvnfudw99vn94wr75tpzpkxan3e2rk2fxvwn',
        nmemonic: 'copper vital hint wide swift finger whisper over cradle crew income erode dilemma trick front mosquito all tissue clever oblige sting obtain round frequent'
    });

    switch (process.argv[2])
    {
        case 'create':
            res = await bz.create(process.argv[3], process.argv[4]);

            break;
        case 'read':
            bz.read(process.argv[3]);
            break;
        case 'update':
            bz.update(process.argv[3], process.argv[4]);
            break;
        case 'delete':
            bz.delete(process.argv[3]);
            break;
    }
};


main();
//    .catch(e => console.error(e.message))
//    .finally(() => bz && bz.close());
