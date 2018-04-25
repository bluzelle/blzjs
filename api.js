const communication = require('./communication');
const {valToBase64, base64ToVal} = require('./base64convert');


const createBase64 = communication.create;

const createWithConversion = (key, value) =>
    createBase64(key, valToBase64(value));


const updateBase64 = communication.update;

const updateWithConversion = (key, value) =>
    updateBase64(key, valToBase64(value));

const readBase64 = communication.read;

const readWithConversion = key =>
    readBase64(key).then(
    	base64ToVal);


module.exports = Object.assign(communication, {
    create: createWithConversion,
    update: updateWithConversion,
    read: readWithConversion
});
