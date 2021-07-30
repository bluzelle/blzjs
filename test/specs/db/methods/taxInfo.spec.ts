import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('taxInfo()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should return the tax info', () => {
        return bz.taxInfo()
            .then(taxInfo => {
                expect(taxInfo).to.have.property('FeeBp', '100')
                expect(taxInfo).to.have.property('TransferBp', '1')
                expect(taxInfo).to.have.property('Collector', 'bluzelle1wjkdcz4hl4gcarnqtupu7vkftal6h34qxjh6rw')
            });
    });
});