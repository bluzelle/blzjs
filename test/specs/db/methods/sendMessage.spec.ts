import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('sendMessage()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should send a message', () => {
        return bz.create('key', 'value', defaultGasParams())
            .then(() => bz.sendMessage({
                    type: 'crud/read',
                    value: {
                        Key: 'key',
                        UUID: bz.uuid,
                        Owner: bz.address
                    }
                }, defaultGasParams())
            )
            .then((response: any) => expect(response.data[0].value).to.equal('value'));
    });
});