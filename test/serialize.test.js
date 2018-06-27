const {valToUInt8, uInt8ToVal} = require('../src/serialize');
const {isEqual} = require('lodash');
const assert = require('assert');

describe('serialize', () => {

	it('should convert numbers', () => {

		const val = 123;

		const arr = valToUInt8(val);

		assert(uInt8ToVal(arr) === val);


		const float = 3.1415926535;

		const arr2 = valToUInt8(float);

		assert(uInt8ToVal(arr2) === float);


		const smallNum = 1.88e-13;

		const arr3 = valToUInt8(smallNum);

		assert(uInt8ToVal(arr3) === smallNum);

	});


	it('should convert JSON objects', () => {

		const val = { a: { b: [1, 2, 3, 'hello'] }};

		const arr = valToUInt8(val);

		assert(isEqual(uInt8ToVal(arr), val));

	});


	it('should convert strings', () => {

		const val = 'hello\nworld!';

		const arr = valToUInt8(val);

		assert(uInt8ToVal(arr) === val);

	});


	it('should convert bytearray data', () => {

		const val = new Uint8Array([1, 2, 3]);

		const arr = valToUInt8(val);

		const arr2 = uInt8ToVal(arr);

		assert(isEqual(val, arr2));

	});

});
