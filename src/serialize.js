const {TextEncoder, TextDecoder} = require('text-encoding');
const {decode: decodeBase64} = require('base64-arraybuffer');

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

	const type = typeof val;


	if(val instanceof ArrayBuffer || ArrayBuffer.isView(val)) {

		return new Uint8Array([BIN_PREFIX, ... new Uint8Array(val)])

	}


	return new Uint8Array([OBJ_PREFIX, ...encode(JSON.stringify(val))]);

};


const uInt8ToVal = arr => {

	const prefix = arr[0];
	const rest = arr.subarray(1);


	if(prefix === BIN_PREFIX) {

        return rest;

	}

	if(prefix === OBJ_PREFIX) {

		return JSON.parse(decode(rest));

	}


    throw new Error("Response prefix not recognized as binary data or object data");

};



module.exports = {
    valToUInt8,
    uInt8ToVal
};