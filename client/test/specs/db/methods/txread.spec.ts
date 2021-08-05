import {expect} from 'chai'
import {API} from '../../../../lib/API';
import {createKeys, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {useChaiAsPromised} from "testing/lib/globalHelpers";



describe('txRead()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: API;

    beforeEach(async () => {
        bz = await sentryWithClient();
        useChaiAsPromised();
    });

    it('should work with empty value', async () => {
        await bz.create('key', '', defaultGasParams());
        expect(await bz.txRead('key', defaultGasParams())).to.have.property('value', '');
    })

    it('should retrieve values in order', async () => {
        const results = await Promise.all([
            bz.create('mykey', 'myvalue', defaultGasParams()),
            bz.txRead('mykey', defaultGasParams()),
            bz.update('mykey', 'avalue', defaultGasParams()),
            bz.txRead('mykey', defaultGasParams())
        ]);
        expect(results?.[1]?.value).to.equal('myvalue');
        expect(results?.[3]?.value).to.equal('avalue');
    })


    it('should retrieve a value from the store', async () => {
        await bz.create('myKey', 'myvalue', defaultGasParams());
        await expect(await bz.txRead('myKey', defaultGasParams()).then(x => x?.value)).to.equal('myvalue');
    });

    it('should throw an error if key does not exist', async () => {
        expect(await bz.txRead('noKey', defaultGasParams()).catch(e => e)).to.match(/Key does not exist/);
    });

    it('should handle parallel reads', async () => {
        const {keys, values} = await createKeys(bz, 5);
        expect(
            await Promise.all(keys.map(key => bz.txRead(key, defaultGasParams()).then(x => x?.value)))
        ).to.deep.equal(values);
    });


});


