import {APIAndSwarm, DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from 'chai';
import {useChaiAsPromised} from "../../../helpers/global-helpers";

describe('abciQuery()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
        .then(() => useChaiAsPromised())
    );

    it('should send a abci query', () => {
        return bz.abciQuery<any>('custom/acc/account', {
            Address: bz.address
        })
            .then(({result}) => {
                bz.getBNT({ubnt: true})
                    .then(value => {
                        expect(result.value.coins[0].amount).to.equal(value.toString())
                    })
            });
    });

    it('should return an error for a bad path', () => {
        return bz.abciQuery<any>('fake/path')
            .catch(e => {
                expect(e.status).to.equal(400);
                expect(e.error).to.equal('unknown request: unknown query path');
            });
    });

    it('should return any errors', () => {
        return bz.abciQuery<any>('custom/acc/account', {
            Address: 'bluzelle1ws42h2gjr6q8u5d2teexhrzz9xr9lqrxru50u5'
        })
            .catch(e => expect(e.status).to.equal(400));
    });
});