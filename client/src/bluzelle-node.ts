import {BluzelleConfig} from "./types/BluzelleConfig";
import {API} from "./API";
import {times} from "lodash"
import {passThrough, passThroughAwait} from "promise-passthrough";
import {sha256} from 'js-sha256'

export {API} from './API';
export {BluzelleConfig} from './types/BluzelleConfig'
export {SearchOptions} from './API'
export {mnemonicToAddress} from './API'
export {GasInfo} from './types/GasInfo'

export type ChunkCallback = (chunk: number, length: number) => unknown

interface Context {
    hash?: string
    data: ArrayBuffer
    chunks: ArrayBuffer[]
    mimeType?: string
}

export interface UploadNftResult {
    hash: string
    mimeType: string
}

const splitDataIntoChunks = (data: ArrayBuffer, chunkSize = 500 * 1024): Promise<ArrayBuffer[]> =>
    Promise.all<ArrayBuffer>(
        times(Math.ceil(data.byteLength / chunkSize)).map(chunkNum =>
            new Promise(resolve => setTimeout(() =>
                resolve(data.slice(chunkSize * chunkNum, chunkSize * chunkNum + chunkSize))
            ))
        )
    )


export const bluzelle = (config: BluzelleConfig): API => new API(config);

export const uploadNft = (url: string, data: Uint8Array, vendor: string, cb?: ChunkCallback): Promise<UploadNftResult> =>
    splitDataIntoChunks(data)
        .then(chunks => ({data, chunks} as Context))
        .then(ctx => ({...ctx, hash: sha256(ctx.data)}))
        .then(passThroughAwait(ctx =>
            Promise.all(ctx.chunks.map((chunk, chunkNum) =>
                fetch(`${url}/nft/upload/${vendor}/${ctx.hash}/${chunkNum}`, {
                    method: 'POST',
                    body: chunk
                })
                    .then(passThrough(() => cb && cb(chunkNum,  ctx.chunks.length)))
            ))
        ))
        .then(({hash, mimeType}) => ({
            hash, mimeType
        } as UploadNftResult));
