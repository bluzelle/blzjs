import {mnemonicToAddress} from "../../../../client";
import {expect} from "chai";

describe('mnemonicToAddress()', function () {
    it('should convert a mnemonic to a bech32 address', () => {
        const mnemonic = 'panda aunt fever behave sound neck rapid disorder involve sphere warm torch engine confirm average crumble limit return sail bring output speak youth doll';
        expect(mnemonicToAddress(mnemonic)).to.equal('bluzelle18tqccam532v0y2qu05ja4z6hut9gn0x8yfv094');
    });
});