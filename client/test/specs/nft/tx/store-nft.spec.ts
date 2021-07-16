import {expect} from 'chai'
global.fetch = require('node-fetch')
import {createHash} from 'crypto'
import {API} from "../../../../lib/API";
import {bluzelle} from "../../../../lib/bluzelle-js";

import {GasInfo} from "../../../../lib/types/GasInfo";


const defaultGasParams = (gasInfo: GasInfo = {}): GasInfo => ({gas_price: 10, max_gas: 100000000, ...gasInfo})


describe("Store and retriving a NFT", () => {

    let bz: API
    beforeEach(() => bz = bluzelle({
        mnemonic: "tail rule tongue bench remove rude depend charge license settle mixture century supreme primary city artefact cradle endless fade pitch boost initial chicken spare",
        endpoint: "http://localhost:1317",
        uuid: "uuid",
        legacy_coin: true
    }));

    describe('CreateNft()', () => {
        it('should store a nft record', () => {
            const hash = createHash("sha256")
                .update("my-nft")
                .digest("hex");
            const id = Date.now().toString()
            return bz.createNft(id, hash, "Mintable", "myUserId", 'image/xxx', "my-meta", defaultGasParams())
                .then(id => bz.getNft(id))
                .then(({Creator, Meta, Mime, Vendor, UserId}) => {
                    expect(Creator).to.equal(bz.address);
                    expect(Meta).to.equal('my-meta');
                    expect(Mime).to.equal('image/xxx');
                    expect(Vendor).to.equal('Mintable');
                    expect(UserId).to.equal('myUserId')
                });
        });
    });
});

//         it('should fail if the checksum does not match', function() {
//             const fakeHash = Date.now().toString();
//             return fetch(`http://localhost:1317/nft/upload/${fakeHash}`, {
//                 method: 'POST',
//                 body: 'testing'
//             })
//                 .then(() => expect(sdk.nft.tx.CreateNft({
//                     creator: sdk.nft.address,
//                     meta: 'my-meta',
//                     mime: 'image/xxx',
//                     id: fakeHash,
//                     host: sdk.nft.url
//                 })).to.be.rejectedWith(/hash.*mismatch/):)
//         })
//     });
//
//     describe('UpdateNft()', () => {
//         it('should update the nft data', () => {
//             const hash = createHash("sha256")
//                 .update("my-nft")
//                 .digest("hex")
//
//
//             return sdk.nft.tx.CreateNft({
//                 creator: sdk.nft.address,
//                 meta: 'my-meta',
//                 mime: 'my-mime',
//                 id: hash,
//                 host: sdk.nft.url
//             })
//                 .then(passThroughAwait(({id}) =>
//                     sdk.nft.tx.UpdateNft({
//                         id: id,
//                         creator: sdk.nft.address,
//                         meta: 'my-meta2',
//                         mime: 'my-mime2',
//                         host: sdk.nft.url,
//                     })
//                 ))
//                 .then(({id}) =>
//                     sdk.nft.q.Nft({id})
//                 )
//                 .then(({Nft}) => {
//                     expect(Nft?.mime).to.equal('my-mime2')
//                     expect(Nft?.meta).to.equal('my-meta2')
//                 })
//         })
//     })
//
//     describe('Helpers', () => {
//         it('should store a 100MB file', () => {
//             return sdk.helpers.nft.uploadNft({
//                 meta: '',
//                 mime: 'image/tiff',
//                 host: sdk.nft.url
//             }, getLargePayload(100))
//                 .then(({id}) => fetchData(id))
//                 .then(({body}) => expect(body).to.deep.equal(getLargePayload(100)))
//         });
//
//         it('should store parallel files', () => {
//             const files = times(10).map(size => getLargePayload(size * 10 + 1));
//             return Promise.all(files.map(file =>
//                 sdk.helpers.nft.uploadNft({
//                     meta: '',
//                     mime: 'my/file',
//                     host: sdk.nft.url
//                 }, file)
//                     .then(({id}) => fetchData(id))
//                     .then(({body}) => expect(body).to.deep.equal(file))
//             ))
//         })
//     });
//
// });
//
// const getLargePayload = memoize<(length: number) => Uint8Array>((length) => {
//     return new Uint8Array(length * 1024 * 1024).map((v, idx) => idx % 256)
// });
//
// const fetchData = (id: string) =>
//     fetch(`http://localhost:1317/nft/data/${id}`)
//         .then(x => x.arrayBuffer().then(buf => ({x, buf})))
//         .then(resp => ({
//             body: new Uint8Array(resp.buf),
//             contentType: resp.x.headers.get('content-type')
//         }))
