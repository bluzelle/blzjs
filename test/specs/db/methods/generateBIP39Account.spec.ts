import {
    APIAndSwarm,
    DEFAULT_TIMEOUT,
    defaultGasParams,
    newBzClient,
    sentryWithClient
} from "../../../helpers/client-helpers";
import {expect} from 'chai';

describe('generateBIP39Account()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db));

    it('should generate a new mnemonic if not given entropy', () => {
        const mnemonic = bz.generateBIP39Account();
        expect(mnemonic.split(' ')).to.have.length(24);
    });

    it('should generate the same mnemonic if provided with entropy', () => {
        expect(bz.generateBIP39Account('56a41de798de7899ae98776fb781209c4fe34ad64317c7835ae69134fe671a6f')).to.equal('find can ketchup coyote travel error risk auction hurry rose else decade wreck pistol flip glass shy bracket rifle carbon exit crime have unfair');
    });

    it('should throw an error if entropy is the wrong length', () => {
        expect(() => bz.generateBIP39Account('5648883')).to.throw('Entropy must be 64 char hex')
    });

    it('should generate a valid account', async () => {
        const bz2 = await newBzClient(bz);
        return bz2.create('key', 'value', defaultGasParams())
            .then(() => bz2.read('key'))
            .then(value => expect(value).to.equal('value'));
    });
});