const {valToUInt8, uInt8ToVal} = require('../src/serialize');
const {isEqual} = require('lodash');
const assert = require('assert');

describe('serialize', () => {


	it('should convert strings', () => {

		const val = 'hello\nworld!';

		const arr = valToUInt8(val);

		assert(uInt8ToVal(arr) === val);

	});


	it('should not convert anything else', done => {

		const val = 5;

		try {

			const arr = valToUInt8(val);

		} catch(e) {

			done();
			
		}

	});

});
