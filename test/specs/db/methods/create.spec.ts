import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "../../../helpers/global-helpers";
import {expect} from 'chai';
import * as fs from 'fs';
import {getPrintableChars} from "../../../helpers/test-helpers";


describe('create()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised()));

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
        return expect(bz.create('', 'value', defaultGasParams())).to.be.rejectedWith(Error, 'Key cannot be empty');
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
            .then(() => expect(bz.create('key', 'secondValue', defaultGasParams())).to.be.rejectedWith('Key already exists'))

        // expect(await bz.read('key')).to.equal('value');
        //
        // let caught;
        // await bz.create('key', 'secondValue', defaultGasParams())
        //     .catch(e => caught = e.error)
        // expect(caught).to.match(/Key already exists/);
    });
});