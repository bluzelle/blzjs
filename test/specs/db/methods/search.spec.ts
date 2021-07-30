import {APIAndSwarm, DEFAULT_TIMEOUT, defaultGasParams, sentryWithClient} from "../../../helpers/client-helpers";
import {times} from "lodash";
import {expect} from "chai";

describe('search()', function () {
    this.timeout(DEFAULT_TIMEOUT);
    let bz: APIAndSwarm;

    beforeEach(() => sentryWithClient()
        .then(db => bz = db)
    );

    it('should allow for a blank prefix', () => {
        return Promise.all(
            times(6, emptyString => bz.create(emptyString.toString(), 'value', defaultGasParams()))
        )
            .then(() => bz.search('', {limit: 3}))
            .then(searchResults => searchResults.map(it => it.key))
            .then(searchResults => expect(searchResults).to.deep.equal(['0', '1', '2']));
    });

    it('should return a list of keys/values by default', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz.create('key3', 'value', defaultGasParams());
        })
            .then(() => bz.search('key'))
            .then(searchResults => expect(searchResults).to.deep.equal([
                    {
                        "key": "key1",
                        "value": "value"
                    },
                    {
                        "key": "key2",
                        "value": "value"
                    },
                    {
                        "key": "key3",
                        "value": "value"
                    }
                ])
            );
    });

    it('should find only keys that match the search text', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz.create('myKey1', 'value', defaultGasParams());
            bz.create('myKey2', 'value', defaultGasParams());
        })
            .then(() => bz.search('my'))
            .then(searchResults => expect(searchResults).to.deep.equal([
                    {
                        "key": "myKey1",
                        "value": "value"
                    },
                    {
                        "key": "myKey2",
                        "value": "value"
                    }
                ])
            );
    });

    it('should page results', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz.create('key3', 'value', defaultGasParams());
        })
            .then(() => bz.search('key', {page: 1, limit: 2}))
            .then(searchResults => expect(searchResults).to.deep.equal([
                    {
                        "key": "key1",
                        "value": "value"
                    },
                    {
                        "key": "key2",
                        "value": "value"
                    }
                ])
            )
            .then(() => bz.search('key', {page: 2, limit: 2}))
            .then(searchResults => expect(searchResults).to.deep.equal([
                    {
                        "key": "key3",
                        "value": "value"
                    }
                ])
            );
    });

    it('should return an empty result if no more pages', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'foo', defaultGasParams());
            bz.create('key2', 'foo', defaultGasParams());
            bz.create('key3', 'foo', defaultGasParams());
        })
            .then(() => bz.search('key', {page: 3, limit: 2}))
            .then(searchResults => expect(searchResults).to.have.length(0));
    });

    it('should reverse results if reverse set to true', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz.create('key3', 'value', defaultGasParams());
        })
            .then(() => bz.search('key', {reverse: true}))
            .then(searchResults => expect(searchResults).to.deep.equal([
                    {
                        "key": "key3",
                        "value": "value"
                    },
                    {
                        "key": "key2",
                        "value": "value"
                    },
                    {
                        "key": "key1",
                        "value": "value"
                    }
                ])
            );
    });

    it('should reverse results even when paging', () => {
        return bz.withTransaction(() => {
            bz.create('key1', 'value', defaultGasParams());
            bz.create('key2', 'value', defaultGasParams());
            bz.create('key3', 'value', defaultGasParams());
        })
            .then(() => bz.search('key', {reverse: true, page: 1, limit: 2}))
            .then(searchResults => expect(searchResults).to.deep.equal([
                    {
                        "key": "key3",
                        "value": "value"
                    },
                    {
                        "key": "key2",
                        "value": "value"
                    }
                ])
            );
    });
});