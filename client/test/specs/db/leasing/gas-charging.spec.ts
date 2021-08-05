
import {API} from "../../../../lib/API";
import {expect} from "chai";
import {bluzelle, GasInfo} from "../../../../lib/bluzelle-node";
import {localChain} from "../../../config";
import {LeaseInfo} from "../../../../lib/types/LeaseInfo";

const defaultGasParams = (gasInfo: GasInfo = {}): GasInfo => ({gas_price: 0.02, max_gas: 100000000, ...gasInfo})
const zeroLease = {hours: 0} as LeaseInfo
describe('GasMeter Keeper tests', function () {

    let bz: API;

    beforeEach(async () => {
        bz = bluzelle({
            mnemonic: localChain.mnemonic,
            endpoint: localChain.endpoint,
            uuid: Date.now().toString(),
            legacy_coin: true
        })
    });


    it('should charge more for a longer lease', async () => {
        let bal1: number
        let bal2: number
        bal1 = await bz.getBNT({ubnt: true})
        await bz.create('key1', 'value', defaultGasParams(), {...zeroLease, seconds: 15});
        const remainingBal1 = await bz.getBNT({ubnt: true})
        bal1 -= remainingBal1
        bal2 = await bz.getBNT({ubnt: true})
        await bz.create('key2', 'value', defaultGasParams(), {...zeroLease, days: 1});
        const remainingBal2 = await bz.getBNT({ubnt: true})
        bal2 -= remainingBal2

        expect(bal1).to.be.lessThan(bal2);
    });

    it ('should charge for a larger key-value stored', async () => {
        let bal1: number
        let bal2: number
        const longString = '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
        bal1 = await bz.getBNT()
        await bz.create(longString, longString, defaultGasParams(), {...zeroLease, seconds: 15});
        const remainingBal1 = await bz.getBNT()
        bal1 -= remainingBal1
        bal2 = await bz.getBNT()
        await bz.create('shortString', 'shortValue', defaultGasParams(), {...zeroLease, days: 1});
        const remainingBal2 = await bz.getBNT()
        bal2 -= remainingBal2

        expect(bal1).to.be.greaterThan(bal2);
    })
})


