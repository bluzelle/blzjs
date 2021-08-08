import {expect} from 'chai'

global.fetch = require('node-fetch')
import {createHash} from 'crypto'
import {API} from "../../../../lib/API";
import {bluzelle} from "../../../../lib/bluzelle-node";
import {memoize, times} from "lodash"
import {GasInfo} from "../../../../lib/types/GasInfo";
import {uploadNft} from "../../../../lib/bluzelle-node";
import fs, {promises} from "fs";
import path from "path";
import delay from "delay";
import {Swarm} from 'daemon-manager/lib/Swarm'
import {SwarmConfig, SentryTypes, PruningTypes} from 'daemon-manager/lib/SwarmConfig'
import {Daemon} from 'daemon-manager/lib/Daemon'
import waitUntil from 'async-wait-until';
import {passThrough, passThroughAwait} from "promise-passthrough";
import {Some} from "monet";


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const defaultGasParams = (gasInfo: GasInfo = {}): GasInfo => ({gas_price: 10, max_gas: 100000000, ...gasInfo})

const getSentryUrl = (port: number = 1317): string =>
    `https://18.142.15.86:${port}`;

const encodeData = (data: string): Uint8Array => new TextEncoder().encode(data);

const decodeData = (data: Uint8Array): string => new TextDecoder().decode(data)

type APIAndSwarm = { bz: API, swarm: Swarm }

const getAPIAndSwarm = (config: SwarmConfig, reimage: boolean = false): Promise<APIAndSwarm> =>
    Swarm.stopDaemons(config)
        .then(() => new Swarm(config).start({reimage}))
        .then(swarm => swarm.connect())
        .then(swarm =>
            swarm.getValidators()[0].getAuth()
                .then(auth => auth.mnemonic)
                .then(mnemonic => bluzelle({
                    mnemonic,
                    endpoint: getSentryUrl(),
                    uuid: "uuid",
                }))
                .then(bz => ({
                    bz,
                    swarm
                }))
        );

const createBz = (bz: API, url: string = getSentryUrl()): API =>
    Some(bz.generateBIP39Account())
        .map(mnemonic => bluzelle({
            mnemonic,
            uuid: Date.now().toString(),
            endpoint: url,
        }))
        .map(async (newBz) => {
            await bz.transferTokensTo(newBz.address, 100000, defaultGasParams(), {ubnt: true})
            return newBz
        })
        .join();

const createMintedBz = (url: string = getSentryUrl()): Promise<API> =>
    fetch(`${url}/mint`)
        .then(x => x.arrayBuffer().then(buf => ({x, buf})))
        .then(resp => ({
            body: new Uint8Array(resp.buf),
            contentType: resp.x.headers.get('content-type') || ''
        }))
        .then(({body}) => new TextDecoder().decode(body))
        .then(x => JSON.parse(x))
        .then(resp => resp.mnemonic)
        .then(mnemonic => bluzelle({
            mnemonic,
            endpoint: getSentryUrl(),
            uuid: Date.now().toString(),
        }));


const checkFileReplication = (daemon: Daemon, hash: string, fileSize: number): Promise<Daemon> =>
    waitUntil(() =>
            daemon.exec(`stat -c "%s" .blzd/nft/${hash}`)
                .then(resp => /^[0-9]*$/.test(resp) ? resp : '0')
                .then(parseInt)
                .then(size => size === fileSize)
        , {timeout: 50000}
    )
        .then(() => console.log("File replicated on ", daemon.getName()))
        .then(() => daemon);

const checkInfoFileReplication = (daemon: Daemon, hash: string): Promise<Daemon> =>
    waitUntil(() =>
            daemon.exec(`ls .blzd/nft/${hash}.info`)
                .then(x => /No such file/.test(x) === false)
        , {timeout: 50000}
    )
        .then(() => console.log("Metadata file replicated on ", daemon.getName()))
        .then(() => daemon);

const checkUpload = (daemon: Daemon, hash: string, vendor: string): Promise<Daemon> =>
    waitUntil(() =>
            daemon.exec(`ls .blzd/nft-upload/${vendor}/${hash}*`)
                .then(x => /No such file/.test(x) === false)
        , {timeout: 50000}
    )
        .then(() => console.log("Files were uploaded", daemon.getName()))
        .then(() => daemon);

const checkVendorInfoFileReplication = (daemon: Daemon, vendor: string, id: string): Promise<Daemon> =>
    waitUntil(() =>
            daemon.exec(`ls .blzd/nft/${vendor}-${id}.info`)
                .then(x => /No such file/.test(x) === false)
        , {timeout: 50000}
    )
        .then(() => console.log("Metadata file replicated on ", daemon.getName()))
        .then(() => daemon);

const checkMimeType = (daemon: Daemon, hash: string, mimeType: string): Promise<Daemon> =>
    daemon.exec(`cat .blzd/nft/${hash}.info`)
        .then(resp => expect(resp.Mime).to.equal(mimeType))
        .then(() => daemon)

const checkFileSize = (daemon: Daemon, hash: string, size: number): Promise<Daemon> =>
    daemon.exec(`stat -c "%s" .blzd/nft/${hash}`)
        .then(parseInt)
        .then(fileSize => expect(fileSize).to.equal(size))
        .then(() => console.log("File size matches on ", daemon.getName()))
        .then(() => daemon);

const checkFileSizeFromEndpoint = (daemon: Daemon, hash: string, size: number): Promise<Daemon> =>
    fetchDataWithHash(hash)
        .then((resp: { body: Uint8Array, contentType: string }) => {
            expect(resp.body.length).to.equal(size)
            console.log("File size from endpoint matches on ", daemon.getName())
        })
        .then(() => daemon);

const checkTextFileContents = (daemon: Daemon, hash: string, contents: string): Promise<Daemon> =>
    daemon.exec(`cat .blzd/nft/${hash}`)
        .then(resp => expect(resp).to.equal(contents))
        .then(() => console.log("File contents matches on ", daemon.getName()))
        .then(() => daemon);

const checkHashEndpoint = (daemon: Daemon, hash: string, contents: string): Promise<Daemon> =>
    daemon.getIPAddress()
        .then(ip => fetchDataWithHash(hash, `https://${ip}:${daemon.getRestPort().toString()}`))
        .then((resp: { body: Uint8Array, contentType: string }) => {
            console.log(decodeData(resp.body))
            expect(resp.body).to.deep.equal(encodeData(contents))
            console.log("File contents from endpoint matches on ", daemon.getName())

        })
        .then(() => daemon);

const checkHashEndpointBytes = (daemon: Daemon, hash: string, contents: Uint8Array): Promise<Daemon> =>
    daemon.getIPAddress()
        .then(ip => fetchDataWithHash(hash, `https://${ip}:${daemon.getRestPort().toString()}`))
        .then((resp: { body: Uint8Array, contentType: string }) => {
            console.log(decodeData(resp.body))
            expect(resp.body).to.deep.equal(contents)
        })
        .then(() => daemon);

const checkVendorIdEndpoint = (daemon: Daemon, id: string, vendor: string, contents: string): Promise<Daemon> =>
    daemon.getIPAddress()
        .then(ip => {
            console.log(ip)
            return fetchDataWithIdAndVendor(id, vendor, `https://${ip}:${daemon.getRestPort().toString()}`)
        })
        .then(passThrough(() => console.log("Request made to", id, vendor)))
        .then((resp: { body: Uint8Array, contentType: string }) => expect(resp.body).to.deep.equal(encodeData(contents)))
        .then(() => console.log("File contents from endpoint matches on ", daemon.getName()))
        .then(() => daemon);

const checkVendorIdEndpointBytes = (daemon: Daemon, id: string, vendor: string, contents: Uint8Array): Promise<Daemon> =>
    daemon.getIPAddress()
        .then(ip => fetchDataWithIdAndVendor(id, vendor, `https://${ip}:${daemon.getRestPort().toString()}`))
        .then((resp: { body: Uint8Array, contentType: string }) => expect(resp.body).to.deep.equal(contents))
        .then(() => daemon);

const getLargePayload = memoize<(length: number) => Uint8Array>((length) => {
    return new Uint8Array(length * 1024 * 1024).map((v, idx) => idx % 256)
});

const fetchData = (hash: string = '', {id, vendor}: { id?: string, vendor?: string }): Promise<unknown> =>
    (id ? fetch(`${getSentryUrl()}/nft/${vendor}/${id}`) : fetch(`${getSentryUrl()}/nft/${hash}`))
        .then(resp => resp);

const fetchDataWithIdAndVendor = (id: string, vendor: string, url: string = getSentryUrl()) =>
    fetch(`${url}/nft/${vendor}/${id}`)
        .then(x => x.arrayBuffer().then(buf => ({x, buf})))
        .then(resp => ({
            body: new Uint8Array(resp.buf),
            contentType: resp.x.headers.get('content-type') || ''
        }));
const fetchDataWithHash = (hash: string, url: string = getSentryUrl()) =>
    fetch(`${url}/nft/${hash}`)
        .then(x => x.arrayBuffer().then(buf => ({x, buf})))
        .then(resp => ({
            body: new Uint8Array(resp.buf),
            contentType: resp.x.headers.get('content-type') || ''
        }));

const encodeImage = (filename: string): Promise<Uint8Array> =>
    promises.readFile(path.resolve(__dirname, filename));

describe("Store and retriving a NFT", function () {
    let bz: API
    let swarm: Swarm
    beforeEach(() => {

        return getAPIAndSwarm(mattnetConfig)
            .then(({bz: newBz, swarm: newSwarm}) => {
                bz = newBz
                swarm = newSwarm
            })
            .then(() => delay(10000))   // wait for MsgRegisterPeer to go through
            .then(() => Promise.all(
                swarm.getDaemons()
                    .map(d => d.exec(`rm -rf .blzd/nft*`))
            ))
    });


    describe('replication on mattnet', () => {
        this.timeout(300000)
        it('should replicate a file', () => {
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('new nft'), 'binance')
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/txt', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getDaemons()
                        .map(daemon =>
                            checkFileReplication(daemon, hash, 7)
                                .then(() => checkInfoFileReplication(daemon, hash))
                                .then(daemon => checkFileSize(daemon, hash, 7))
                                .then(daemon => checkTextFileContents(daemon, hash, 'new nft'))
                        )
                    ))
        });

        it('should replicate a file using a minted user', async () => {

            const mintedBz = await createMintedBz()

            const id = Date.now().toString()
            await uploadNft(getSentryUrl(), new TextEncoder().encode('new nft'), 'binance')
                .then(passThroughAwait(({hash}) => mintedBz.createNft(id, hash, "binance", "myUserId", 'text/txt', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getDaemons()
                        .map(daemon =>
                            checkFileReplication(daemon, hash, 7)
                                .then(() => checkInfoFileReplication(daemon, hash))
                                .then(daemon => checkFileSize(daemon, hash, 7))
                                .then(daemon => checkTextFileContents(daemon, hash, 'new nft'))
                        )
                    ))
        });

        it('should not append to identical nfts', () => {
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('identical nft'), 'binance')
                .then(() => uploadNft(getSentryUrl(), new TextEncoder().encode('identical nft'), 'binance'))
                .then(passThroughAwait(({hash}) =>
                    swarm.exec(`stat -c "%s" .blzd/nft-upload/binance/${hash}-0000`)
                        .then(size => expect(size).to.equal(13))
                ))
                .then(passThroughAwait(({hash}) =>
                    swarm.exec(`ls .blzd/nft-upload | wc -l`)
                        .then(num => expect(num).to.equal(1))
                ))
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/txt', "", defaultGasParams())))
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/txt', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getDaemons().map(daemon =>
                            checkFileReplication(daemon, hash, 13)
                        )
                    ))
        });

        it('should handle duplicate nfts from multiple vendors', () => {
            let hashBinance: string;
            let hashMintable: string;
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('identical nft'), 'binance')
                .then(({hash: hashResp}) => hashBinance = hashResp)
                .then(() => bz.createNft(id, hashBinance, "binance", "myUserId", 'text/txt', "", defaultGasParams()))
                .then(() => uploadNft(getSentryUrl(), new TextEncoder().encode('identical nft'), 'mintable'))
                .then(({hash: hashResp}) => hashMintable = hashResp)
                .then(() => bz.createNft(id, hashBinance, "mintable", "myUserId", 'text/txt', "", defaultGasParams()))
                .then(() => Promise.all(swarm.getDaemons()
                    .map(d =>
                        checkFileReplication(d, hashBinance, 13)
                            .then(() => checkInfoFileReplication(d, hashBinance))
                            .then(d => checkFileSize(d, hashBinance, 13))
                            .then(d => checkFileSize(d, hashMintable, 13))
                            .then(d => checkTextFileContents(d, hashBinance, 'identical nft'))
                            .then(d => checkTextFileContents(d, hashMintable, 'identical nft'))
                    )
                ))
        });

        it('should replicate a 100MB file', () => {
            const id = Date.now().toString()
            const data = getLargePayload(100)
            return uploadNft(getSentryUrl(), data, 'binance')
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/plain', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getDaemons()
                        .map(daemon =>
                            checkFileReplication(daemon, hash, getLargePayload(100).byteLength)
                                .then((daemon: Daemon) => checkFileSize(daemon, hash, getLargePayload(100).byteLength))
                        )
                    ))
        });

        it('should retrieve 100 MB replicated file from endpoint', () => {
            const id = Date.now().toString()
            const data = getLargePayload(100)
            return uploadNft(getSentryUrl(), data, 'binance')
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/plain', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getSentries('client')
                        .map(daemon =>
                                checkFileReplication(daemon, hash, getLargePayload(100).byteLength)
                                    .then(daemon => checkInfoFileReplication(daemon, hash))
                                    .then(daemon => checkFileSizeFromEndpoint(daemon, hash, getLargePayload(100).byteLength))
                            // .then(daemon => checkHashEndpointBytes(daemon, hash, getLargePayload(100)))
                            // .then(daemon => checkVendorIdEndpointBytes(daemon, id, 'binance', getLargePayload(100)))
                        )
                    ))
        });

        it('should be able to retrieve replicated files from endpoint', () => {
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('new nft'), 'binance')
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/plain', "", defaultGasParams())))
                .then(passThroughAwait(({hash}) =>
                    Promise.all(swarm.getSentries('client').map(sentry =>
                        checkFileReplication(sentry, hash, 7)
                            .then(daemon => checkInfoFileReplication(daemon, hash))
                    ))
                ))
                .then(({hash}) => fetchDataWithHash(hash))
                .then((resp: { body: Uint8Array, contentType: string }) => expect(resp.body).to.deep.equal(encodeData('new nft')))
                .then(() => fetchDataWithIdAndVendor(id, 'binance'))
                .then((resp: { body: Uint8Array, contentType: string }) => expect(resp.body).to.deep.equal(encodeData('new nft')))
        });

        it('should save and return the correct mime type', () => {
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('new nft'), 'binance')
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/plain', "", defaultGasParams())))
                .then(passThroughAwait(({hash}) =>
                    Promise.all(swarm.getSentries().map(sentry =>
                        checkFileReplication(sentry, hash, 7)
                            .then(daemon => checkInfoFileReplication(daemon, hash))
                            .then(daemon => checkMimeType(daemon, hash, 'text/plain'))
                    ))
                ))
                .then(({hash}) => fetchDataWithHash(hash))
                .then((resp: { body: Uint8Array, contentType: string }) => expect(resp.contentType).to.deep.equal('text/plain'))
                .then(() => fetchDataWithIdAndVendor(id, 'binance'))
                .then((resp: { body: Uint8Array, contentType: string }) => expect(resp.contentType).to.deep.equal('text/plain'))
        });

        it('should be able to retrieve replicated files from different vendors', () => {
            let hashBinance: string;
            let hashMintable: string;
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('identical nft'), 'binance')
                .then(({hash: hashResp}) => hashBinance = hashResp)
                .then(() => bz.createNft(id, hashBinance, "binance", "myUserId", 'text/plain', "", defaultGasParams()))
                .then(() => uploadNft(getSentryUrl(), new TextEncoder().encode('identical nft'), 'mintable'))
                .then(({hash: hashResp}) => hashMintable = hashResp)
                .then(() => bz.createNft(id, hashBinance, "mintable", "myUserId", 'text/plain', "", defaultGasParams()))
                .then(() => Promise.all(swarm.getDaemons()
                    .map(d =>
                        checkFileReplication(d, hashBinance, 'identical nft'.length)
                            .then(() => checkInfoFileReplication(d, hashBinance))
                            .then(() => checkVendorInfoFileReplication(d, 'binance', id))
                            .then(() => checkVendorInfoFileReplication(d, 'mintable', id))
                    )
                ))
                .then(() => Promise.all(swarm.getSentries('client')
                    .map(d =>
                        checkVendorIdEndpoint(d, id, 'binance', 'identical nft')
                            .then(d => checkVendorIdEndpoint(d, id, 'mintable', 'identical nft'))
                    )
                ));
        });

        it('should be able to retrieve replicated files from endpoints from all client sentries', () => {
            const id = Date.now().toString()
            return uploadNft(getSentryUrl(), new TextEncoder().encode('new nft'), 'binance')
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "binance", "myUserId", 'text/plain', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getSentries('client').map(sentry =>
                            checkFileReplication(sentry, hash, 7)
                                .then(() => checkInfoFileReplication(sentry, hash))
                                .then(() => checkHashEndpoint(sentry, hash, 'new nft'))
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'binance', 'new nft'))
                        )
                    )
                )
        });

        it.skip('should replicate an image', () => {
            const id = Date.now().toString()
            return encodeImage('test.tiff')
                .then(imageData => uploadNft(getSentryUrl(), imageData, 'mintable'))
                .then(passThroughAwait(({hash}) => bz.createNft(id, hash, "mintable", "myUserId", 'image/tiff', "", defaultGasParams())))
                .then(({hash}) =>
                    Promise.all(swarm.getSentries().map(sentry =>
                            checkFileReplication(sentry, hash, 0)
                        )
                    )
                )
        });

        it('should allow two clients (vendors) to facilitate createNft() in parallel to the same sentry', async () => {
            const newBz = await createMintedBz();
            const id = Date.now().toString()
            await Promise.all([
                uploadNft(getSentryUrl(), encodeData('binance nft'), 'binance'),
                uploadNft(getSentryUrl(), encodeData('mintable nft'), 'mintable')]
            )
                .then(passThroughAwait(([binanceResp, mintableResp]) =>
                    Promise.all([
                        bz.createNft(id, binanceResp.hash, "binance", "myUserId", 'text/plain', "", defaultGasParams()),
                        newBz.createNft(id, mintableResp.hash, "mintable", "myUserId", 'text/plain', "", defaultGasParams())]
                    )
                ))
                .then(passThroughAwait(([binanceResp, mintableResp]) =>
                    Promise.all(swarm.getDaemons().map(daemon =>
                            checkFileReplication(daemon, binanceResp.hash, 'binance nft'.length)
                                .then(() => checkFileReplication(daemon, mintableResp.hash, 'mintable nft'.length))
                                .then(() => checkInfoFileReplication(daemon, binanceResp.hash))
                                .then(() => checkInfoFileReplication(daemon, mintableResp.hash))
                        )
                    )
                ))
                .then(([binanceResp, mintableResp]) =>
                    Promise.all(swarm.getSentries('client').map(sentry =>
                            checkHashEndpoint(sentry, binanceResp.hash, 'binance nft')
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'binance', 'binance nft'))
                                .then(() => checkHashEndpoint(sentry, mintableResp.hash, 'mintable nft'))
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'mintable', 'mintable nft'))
                        )
                    )
                )
        });

        it('should allow one client to facilitate createNft() in parallel to the same sentry', async () => {
            const id = Date.now().toString()
            await Promise.all([
                uploadNft(getSentryUrl(), encodeData('binance nft'), 'binance'),
                uploadNft(getSentryUrl(), encodeData('mintable nft'), 'mintable')]
            )
                .then(passThroughAwait(([binanceResp, mintableResp]) =>
                    Promise.all([
                        bz.createNft(id, binanceResp.hash, "binance", "myUserId", 'text/plain', "", defaultGasParams()),
                        bz.createNft(id, mintableResp.hash, "mintable", "myUserId", 'text/plain', "", defaultGasParams())]
                    )
                ))
                .then(passThroughAwait(([binanceResp, mintableResp]) =>
                    Promise.all(swarm.getDaemons().map(daemon =>
                            checkFileReplication(daemon, binanceResp.hash, 'binance nft'.length)
                                .then(() => checkFileReplication(daemon, mintableResp.hash, 'mintable nft'.length))
                                .then(() => checkInfoFileReplication(daemon, binanceResp.hash))
                                .then(() => checkInfoFileReplication(daemon, mintableResp.hash))
                        )
                    )
                ))
                .then(([binanceResp, mintableResp]) =>
                    Promise.all(swarm.getSentries('client').map(sentry =>
                            checkHashEndpoint(sentry, binanceResp.hash, 'binance nft')
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'binance', 'binance nft'))
                                .then(() => checkHashEndpoint(sentry, mintableResp.hash, 'mintable nft'))
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'mintable', 'mintable nft'))
                        )
                    )
                )
        });

        it('should allow two clients (vendors) to facilitate createNft() in parallel to different sentries', async () => {
            const newBz = await createBz(bz, 'https://3.24.28.51:1317');
            const id = Date.now().toString()
            await Promise.all([
                uploadNft(getSentryUrl(), encodeData('binance nft'), 'binance'),
                uploadNft('https://3.24.28.51:1317', encodeData('mintable nft'), 'mintable')]
            )
                .then(passThroughAwait(([binanceResp, mintableResp]) =>
                    Promise.all([
                        bz.createNft(id, binanceResp.hash, "binance", "myUserId", 'text/plain', "", defaultGasParams()),
                        newBz.createNft(id, mintableResp.hash, "mintable", "myUserId", 'text/plain', "", defaultGasParams())]
                    )
                ))
                .then(passThroughAwait(([binanceResp, mintableResp]) =>
                    Promise.all(swarm.getDaemons().map(daemon =>
                            checkFileReplication(daemon, binanceResp.hash, 'binance nft'.length)
                                .then(() => checkFileReplication(daemon, mintableResp.hash, 'mintable nft'.length))
                                .then(() => checkInfoFileReplication(daemon, binanceResp.hash))
                                .then(() => checkInfoFileReplication(daemon, mintableResp.hash))
                        )
                    )
                ))
                .then(([binanceResp, mintableResp]) =>
                    Promise.all(swarm.getSentries('client').map(sentry =>
                            checkHashEndpoint(sentry, binanceResp.hash, 'binance nft')
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'binance', 'binance nft'))
                                .then(() => checkHashEndpoint(sentry, mintableResp.hash, 'mintable nft'))
                                .then(sentry => checkVendorIdEndpoint(sentry, id, 'mintable', 'mintable nft'))
                        )
                    )
                )
        });

        it.skip('should handle a large number of uploads', () => {
            const id = Date.now().toString();
            return Promise.all(times(200).map(idx =>
                    uploadNft(getSentryUrl(), encodeData(`nft-${idx}`), "mintable")
                        .then(({hash}) => hash)
                )
            )
                .then(passThroughAwait(hashArray =>
                    Promise.all(hashArray.map((hash, idx) =>
                            Some(swarm.getSentries()[0])
                                .map(sentry => checkUpload(sentry, hash, 'mintable'))
                                .join()
                        )
                    )
                ))
        });

        it('should handle large number of creates from multiple users', () => {
            const id = Date.now().toString();
            return Promise.all(times(15).map(idx =>
                    uploadNft(getSentryUrl(), encodeData(`nft-${idx}`), "mintable")
                        .then(passThroughAwait(({hash}) =>
                            createMintedBz()
                                .then(newBz => newBz.createNft(
                                    id,
                                    hash,
                                    "mintable",
                                    "myUserId",
                                    "text/plain",
                                    "",
                                    defaultGasParams()
                                ))))
                        .then(({hash}) => hash)
                )
            )
                .then(passThroughAwait(hashArray =>
                    Promise.all(hashArray.map((hash, idx) =>
                            Promise.all(swarm.getDaemons().map(daemon =>
                                    checkFileReplication(daemon, hash, `nft-${idx}`.length)
                                        .then(() => checkInfoFileReplication(daemon, hash))
                                )
                            )
                                .then(() => Promise.all(swarm.getSentries('client').map(sentry =>
                                    checkHashEndpoint(sentry, hash, `nft-${idx}`)
                                        .then(sentry => checkVendorIdEndpoint(sentry, id, 'mintable', `nft-${idx}`))
                                )))
                        )
                    )
                ))
        });

        it('should allow a single blz client to createNfts in parallel', () => {
            const id = Date.now().toString()
            return Promise.all(times(2).map(
                idx => uploadNft(getSentryUrl(), encodeData(`nft-${idx}`), "mintable")
                )
            )
                .then(x => x)
                .then(passThroughAwait((uploadResults) =>
                    Promise.all(uploadResults.map((result, idx) =>
                        bz.createNft(id, result.hash, 'mintable', `user-${idx}`, "text/plain", "", defaultGasParams())
                        )
                    )
                ))
                .then(x => x)
                .then(passThroughAwait((uploadResults) =>
                    Promise.all(swarm.getDaemons().map(daemon =>
                            Promise.all(uploadResults.map((result, idx) =>
                                checkFileReplication(daemon, result.hash, `nft-${idx}`.length)
                                    .then(() => checkInfoFileReplication(daemon, result.hash))
                            ))
                        )
                    )
                ))
                .then((uploadResults) =>
                    Promise.all(swarm.getSentries('client').map(sentry =>
                            Promise.all(uploadResults.map((result, idx) =>
                                checkHashEndpoint(sentry, result.hash, `nft-${idx}`)
                                    .then(() => checkVendorIdEndpoint(sentry, id, 'mintable', `nft-${idx}`))
                            ))
                        )
                    )
                )
        });

        it('should replicate a large number of files', () => {
            const id = Date.now().toString();
            return Promise.all(times(200).map(idx =>
                    uploadNft(getSentryUrl(), encodeData(`nft-${idx}`), "mintable")
                        .then(passThroughAwait(({hash}) => bz.createNft(
                            id,
                            hash,
                            "mintable",
                            "myUserId",
                            "text/plain",
                            "",
                            defaultGasParams()
                        )))
                        .then(({hash}) => hash)
                )
            )
                .then(passThroughAwait(hashArray =>
                    Promise.all(hashArray.map((hash, idx) =>
                            Promise.all(swarm.getDaemons().map(daemon =>
                                    checkFileReplication(daemon, hash, `nft-${idx}`.length)
                                        .then(() => checkInfoFileReplication(daemon, hash))
                                )
                            )
                                .then(() => Promise.all(swarm.getSentries('client').map(sentry =>
                                    checkHashEndpoint(sentry, hash, `nft-${idx}`)
                                        .then(sentry => checkVendorIdEndpoint(sentry, id, 'mintable', `nft-${idx}`))
                                )))
                        )
                    )
                ))
        });

        it('should handle large number of uploads of large files', () => {
            const id = Date.now().toString();
            return Promise.all(times(200).map(idx =>
                    uploadNft(getSentryUrl(), getLargePayload(idx), "mintable")
                        .then(({hash}) => hash)
                )
            )
                .then(passThroughAwait(hashArray =>
                    Promise.all(hashArray.map((hash, idx) =>
                            Some(swarm.getSentries()[0])
                                .map(sentry => checkUpload(sentry, hash, 'mintable'))
                                .join()
                        )
                    )
                ))
        });

        it('should allow parallel crud creates', () => {
            return Promise.all([
                bz.create("key 1", "value 1", defaultGasParams()),
                bz.create("key 2", "value 2", defaultGasParams())
            ])
                .then(() => Promise.all([
                    bz.read("key 1"),
                    bz.read("key 2")
                ]))
                .then(reads => {
                    expect(reads[0]).to.equal("value 1")
                    expect(reads[1]).to.equal("value 2")
                })
        })

    });


    const mattnetConfig = {
        feeBp: 0,
        transferBp: 0,
        maxInboundPeers: 400,
        maxOutboundPeers: 100,
        corsAllowedOrigins: [],
        pruning: 'nothing' as PruningTypes,
        upnp: false,
        commissionRate: 0.1,
        commissionMaxChangeRate: 0.01,
        commissionMaxRate: 0.2,
        minSelfDelegation: 1,
        gasAdjustment: 1.2,
        logDir: 'logs',
        genesisTokenBalance: 50 * 1000 * 1000,
        chainId: 'bluzelle',
        bluzelleCrud: false,
        bluzelleFaucet: true,
        communityTax: 0.0001,
        baseProposerReward: 0.01,
        bonusProposerReward: 0.04,
        signedBlocksWindow: 1000,
        minSignedPerWindow: 0.5,
        downtimeJailDuration: 600,
        slashFractionDoubleSign: 0.05,
        slashFractionDowntime: 0.0001,
        unbondingTime: 1814400,
        maxValidators: 100,
        minGasPrice: 0.000000002,
        denom: 'bnt',
        monikerBase: 'daemon',
        privateKey: getPrivateKey(),
        targetBranch: 'aven_nft',
        oracleAdmin: "bluzelle1ducse9gtmu34n6dyq3e70x53ata7nka6qa0w82",
        govMinDepositAmount: 10000000,
        govMaxDepositPeriod: 172800,
        govVotingPeriod: 172800,
        govTallyQuorum: 0.334,
        govTallyThreshold: 0.5,
        govTallyVeto: 0.334,
        ssl: false,
        taxCollector: "bluzelle1ducse9gtmu34n6dyq3e70x53ata7nka6qa0w82",
        daemons: ['54.79.213.230',
            '18.142.15.86',
            '65.1.186.244',
            '3.24.28.51',
            '13.213.216.27',
            '54.179.6.127',
            '3.37.164.193',
            '3.37.151.39',
            '3.36.7.190',
            '18.139.187.86'
        ].map((ip, idx) => ({
            host: ip,
            privateKey: getPrivateKey(),
            sentry: idx === 1 || idx === 3 ? 'client' : ((idx % 2 ? 'sandbox' : undefined) as SentryTypes)
        }))
    }

    function getPrivateKey() {
        return '-----BEGIN RSA PRIVATE KEY-----\n' +
            'MIIEowIBAAKCAQEAvRO0Stz5E0m570nsuzWOYey2s4XXRAIHcuQVtlqb4VzEIha0\n' +
            'FYWzhTFyvn0qQ1fgo65VDtZiP/DvuMK8ajTpmo+Wesa++MKGNv9SWVxCvKF7iUfl\n' +
            'fnU/FO8MPS9PA/n3wyyuG1O89DBJRao8H7AjaK0+P2sgOuVc2c/NUC1/bYdJbT+z\n' +
            '4p1FNKr99Hq+03fdGTsXirq5fG+WlpgMuSMflWtq6zhlE7dQGIVpB63Qy/hCmQzW\n' +
            'WWSLhSmJ4IDMufB/gpJ3hqME6KTszBxl+f9WHFnetgeviEE70Rf4f5Yb1RWrZK1e\n' +
            'ecyPs7aiczrrLjaVqUAnUMlutquk2FWbIB20TwIDAQABAoIBAEDB9OgHEs/GWoZY\n' +
            'PVpJF4D2gASwfG/wefihocYY9naTPSGnwPn2FuwxaWlQmR8DhA7LcJpqVrArpw8S\n' +
            's1F02eVz9EgMte+hQDKp89xjOwA8FoGIPFO5eGeFEB4Mi/WCsZcJQIBfh8Hin9Xa\n' +
            'XklEHHyHiWBTInDJiamYAGvLiW9LZYrv34zWGHTHPqWV3hUPqtG6mO90su7hRiDs\n' +
            'PVim8StBH23ndNKVW70m1O2bLIZJg/S6hMcDPoEOnm7occ1WQ9GvK1zHxbuVEH08\n' +
            'j9BUF+WT8yhQz7FIp7oe2UDkt/GN8l9i92WteYslGOgAtdY7VvhDxDdcR2jWjGlX\n' +
            'GoOrc1ECgYEA69abVbU9HWTSVWHXETWsvwgrKfxpudeR7zA0YHE+FCstPWHvoB2D\n' +
            'DW1YueVJ9R0wgRW2co0/WfwNyCpChbIX6OKeAS5OVlO/RMa+F8jDuviNvyp/nYHv\n' +
            'L6x9rbu6eN6txLkAdpPp9JPooTevyzLOGbP1xzQgLUXVW1RubjLSAHsCgYEAzT22\n' +
            'G9Y4s6bh5zkmEM7K9YolXK/lt6L+NyvJFaGmYwEbXI80b+bT86AJX3P1YuiJF967\n' +
            'oKkhmFC7OrP/cyX0cwqU8ZEdkQEIGVymwwQ6qxCvH3k87uVPXfo8xubTkzKO0PZ6\n' +
            'WWrh0QSVr4N3/SmtRDEFtgCwqQJ1X/Bk9AGklT0CgYAzE+3cqD4uSZHMcD5WOdvK\n' +
            'HAjNNR/o4il3NmeBo8UgNSG9M6LkeL/TfqVCzcgw0DubGYrEUJcx9AdAHPb/Yc0P\n' +
            '4VT7SH4q8ERyruCo4hCSRBbfGmM9R9D38FHf+NKwLvpPqwnQpMR89jPiBt+KENzW\n' +
            'cEWA+WcmpwNInoa0U0lsVQKBgQCcN7uUJpMUExLhZztVEcGj8RmNGgl0pChxH++3\n' +
            'eknmE6Ka6hlUj1KGnipkMCP3u90VgSA5ImMCx3grL3RhVeNhaQ2DbRwfEbTzcPUx\n' +
            'fNeW+2UARMyfXYTymBSIpIsoABR6cxEfXF4zNRUl+aBr3rwWKmYZaR8OFWP3uUdt\n' +
            '/o4iVQKBgH6AVcplpVT0O85Ghgb4p91VEPBuwapSi3uGwoCt+KuyxNitozAelLcF\n' +
            'aw3RFY6jn7qUDLWEAnUKXIjsU+CoU5wIVFu3KYqYdGwlQP6UtZsWImO3dliqSJ3q\n' +
            '6CVD47YwZBQFtKuHuQ4j51Ufg3WonVJ4mjSTB1tBxdla0CY9F2So\n' +
            '-----END RSA PRIVATE KEY-----\n'
    }
});