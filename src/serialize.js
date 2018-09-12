const {TextEncoder, TextDecoder} = require('text-encoding');


const encode = (() => {
    
    const encoder = new TextEncoder();
    return encoder.encode.bind(encoder);

})();

const decode = (() => {

    const decoder = new TextDecoder('utf-8');
    return decoder.decode.bind(decoder);

})();


const BIN_PREFIX = 0;
const OBJ_PREFIX = 1;


const valToUInt8 = val => {


    if(typeof val !== 'string') {

        throw new Error('Bluzelle: Attempting to set value as non-string.');

    }


    return new Uint8Array(encode(val));

};


const uInt8ToVal = arr => {

    return arr ? decode(arr) : undefined;

};



module.exports = {
    valToUInt8,
    uInt8ToVal
};