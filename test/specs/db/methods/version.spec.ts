import {DEFAULT_TIMEOUT, sentryWithClient} from "../../../helpers/client-helpers";
import {expect} from "chai";

describe('version()', function () {
    this.timeout(DEFAULT_TIMEOUT);

    it('should return a version', () => {
        return sentryWithClient()
            .then(bz => bz.version()
                .then(version => expect(version).to.match(/^.*-.*-.*$/))
            );
    });
});