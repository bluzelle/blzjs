import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';
import * as fs from 'fs';
import {getPrintableChars} from "../../../helpers/test-helpers";
import {bluzelle} from "../../../../client";


describe('create()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should return chain info', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(result => {
                expect(result.height).to.be.lessThan(10);
                expect(result.txhash).to.be.a('string');
                expect(result.gasWanted).to.be.a('number');
                expect(result.gasUsed).to.be.a('number');
            });
    });

    it('should be able to store an empty value', () => {
        return bz.create('key', '', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.be.equal(''));
    });

    it('should handle large documents', () => {
        const testJson = fs.readFileSync(`${__dirname}/large-doc.json`).toString();

        return bz.create('key', testJson, defaultGasParams())
            .then(() => bz.read('key'))
            .then(json => expect(json).to.equal(testJson));
    });

    it('should handle long keys', () => {
        const longKey = '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'

        return bz.create(longKey, 'value', defaultGasParams())
            .then(() => bz.keys())
            .then(keys => expect(keys[0]).to.equal(longKey))
            .then(() => bz.read(longKey))
            .then(value => expect(value).to.equal('value'));
    });

    it('should handle keys and values with symbols', () => {
        const symbols = getPrintableChars().replace('/', '');

        return bz.create(symbols, symbols, defaultGasParams())
            .then(() => bz.keys())
            .then(keys => expect(keys).to.contain(symbols))
            .then(() => bz.read(symbols))
            .then(value => expect(value).to.equal(symbols));
    });

    it('should throw an error if key includes "/"', () => {
        return expect(bz.create('xx/yy', 'xx', defaultGasParams())).to.be.rejectedWith('Key cannot contain a slash');
    });

    it('should throw an error if key is empty', () => {
        return expect(bz.create('', 'value', defaultGasParams())).to.be.rejectedWith('Key cannot be empty');
    });

    it('should handle values with symbols', () => {
        const symbols = getPrintableChars();

        return bz.create('key', symbols, defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal(symbols));
    });

    it('should create a key with value in the database', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'));
    });

    it('should throw an error if a key already exists and not update the value', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.read('key'))
            .then(value => expect(value).to.equal('value'))
            .then(() => bz.create('key', 'secondValue', defaultGasParams())
                .catch(e => expect(e.error).to.equal('invalid request: Key already exists: failed to execute message'))
            );
    });

    it('should be able to handle parallel creates', () => {
        return createKeys(bz, 5)
            .then(() => bz.count())
            .then(count => expect(count).to.equal(5));
    });

    it('should handle creates that are sent simultaneously from seperate clients', async () => {
        const bz2 = bluzelle({
            mnemonic: bz.generateBIP39Account(),
            uuid: bz.uuid,
            endpoint: bz.url
        })

        await bz.transferTokensTo(bz2.address, 10000, defaultGasParams())


        let caught = false;

        await Promise.all([
            bz.create('foo', 'bar1', defaultGasParams()).catch(e => {
                expect(e.error).to.equal('Key already exists')
                caught = true;
            }),
            bz2.create('foo', 'bar2', defaultGasParams()).catch(e => {
                expect(e.error).to.match(/Key already exists/)
                caught = true;
            })
        ])
        expect(caught).to.be.true;
    });

    it('should throw an error if assigned insufficient gas price', () => {
        return bz.create('key', 'value', {gas_price: 0.0001})
            .catch(e => expect(e.error).to.be.equal('insufficient fees'));
    });

    // Revisit this test to make it test on gas left in account
    it('should charge for gas on transactions', async () => {
        expect(await bz.create('key', 'value', {max_gas: 1}).catch(e => e.error)).to.equal('insufficient fees');
    });

    it('should throw an error if assigned insufficient max fee', () => {
        return bz.create('key', 'value', {max_fee: 1})
            .catch(e => expect(e.error).to.equal('insufficient fees'));
    });

    it('should throw an error if the key is not a string', () => {
        // @ts-ignore - testing bad param
        return expect(bz.create(10, 'value', defaultGasParams())).to.be.rejectedWith('Key must be a string');
    });

    it('should throw an error if the value is not a string', () => {
        // @ts-ignore - testing bad param
        return expect(bz.create('key', 10, defaultGasParams())).to.be.rejectedWith('Value must be a string');
    });

    it('should throw an error if the lease time is less than 0', () => {
        return expect(bz.create('key', 'value', defaultGasParams(), {days: -1})).to.be.rejectedWith('Invalid lease time');
    });

    it('can store json', () => {
        const testJson = JSON.stringify({foo: 10, bar: 'baz', t: true, arr: [1, 2, 3]});
        return bz.create('key', testJson, defaultGasParams())
            .then(() => bz.read('key'))
            .then(jsonValue => expect(jsonValue).to.equal(testJson));
    });

    it('can handle multiple creates', () => {
        return createKeys(bz, 5)
            .then(x => x)
            .then(() => Promise.all([
                bz.read('key0'),
                bz.read('key1'),
                bz.read('key2'),
                bz.read('key3'),
                bz.read('key4'),
            ]))
            .then(responses => expect(responses).to.deep.equal(['value0', 'value1', 'value2', 'value3', 'value4']))
    });
});