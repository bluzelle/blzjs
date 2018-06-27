const communication = require('./communication');
const {valToUInt8, uInt8ToVal} = require('./serialize');


const createSerial = communication.create;

const createWithConversion = (key, value) =>
    createSerial(key, valToUInt8(value));


const updateSerial = communication.update;

const updateWithConversion = (key, value) =>
    updateSerial(key, valToUInt8(value));

const readSerial = communication.read;

const readWithConversion = key =>
    readSerial(key).then(uInt8ToVal);


module.exports = Object.assign(communication, {
    create: createWithConversion,
    update: updateWithConversion,
    read: readWithConversion
});
