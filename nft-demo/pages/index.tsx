import React, {ChangeEvent, useState} from "react";
import {bluzelle, uploadNft} from "bluzelle"
import {contentType} from "mime-types";
import {getUrl} from "../getSdk";
import {passThrough, passThroughAwait} from "promise-passthrough";
import delay from "delay";

export default function Home() {
    const [state, setState] = useState<string>('ready')

    const onFileSelected = (ev: ChangeEvent<HTMLInputElement>) => {
        setState('uploading')
        ev.target.files?.[0].arrayBuffer()
            .then(data => uploadNft(getUrl(1317, 1317), data as Uint8Array, "SomeVendor"))
            .then(passThrough(() => setState('notifying network')))
            .then(ctx =>
                fetch(process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api/createNft' : `http://nft.bluzelle.com/api/createNft`, {
                method: 'POST',
                body: JSON.stringify({
                    hash: ctx.hash,
                    vendor: 'SomeVendor',
                    userId: "MyUserId",
                    mime: contentType(ev.target.files?.[0].name || '')
                })
            })
                    .then(x => x.arrayBuffer().then(buf => ({x, buf})))
                    .then(resp => ({
                        body: new Uint8Array(resp.buf),
                        contentType: resp.x.headers.get('content-type') || ''
                    }))
                    .then(({body}) => new TextDecoder().decode(body))
                    .then(id => ({...ctx, id, vendor: "SomeVendor"})))
            .then(ctx => setState(`done:${ctx.id},${ctx.vendor},${ctx.hash}`))
    }


    return (
        <div style={{background: '#0f0921', color: "white"}}>

            <main>
                <h2 style={{fontSize: '3em'}}>
                    Bluzelle NFT Reliable Storage
                </h2>
                <div style={{paddingTop: 20, paddingBottom: 20}}>
                    {state === 'ready' ? (
                        <input id="image-file" type="file" onInput={onFileSelected}/>
                    ) : (
                        state
                    )}
                </div>
                <div style={{paddingTop: 10}}>
                    {state.includes('done:') ? (
                        <>
                            <NodeLink id={state.replace('done:', '').split(',')[0]} vendor={state.replace('done:', '').split(',')[1]} hash={state.replace('done:', '').split(',')[2]}/>
                        </>
                    ) : null}
                </div>
            </main>

        </div>
    )
}

const NodeLink: React.FC<{ id: string, vendor: string , hash: string}> = ({id, vendor, hash}) => (
    <>
        <div style={{padding: 5}}>
            <a href={`https://client.sentry.testnet.public.bluzelle.com:1317/nft/${vendor}/${id}`} target="_blank">
                https://client.sentry.testnet.public.bluzelle.com:1317/nft/{vendor}/{id}
            </a>
        </div>
        <div style={{padding: 5}}>
            <a href={`https://a.client.sentry.testnet.public.bluzelle.com:1317/nft/${vendor}/${id}`} target="_blank">
                https://a.client.sentry.testnet.public.bluzelle.com:1317/nft/{vendor}/{id}
            </a>
        </div>
        <div style={{padding: 5}}>
            <a href={`https://b.client.sentry.testnet.private.bluzelle.com:1317/nft/${vendor}/${id}`} target="_blank">
                https://b.client.sentry.testnet.public.bluzelle.com:1317/nft/{vendor}/{id}
            </a>
        </div>
        <div style={{padding: 5}}>
            <a href={`https://client.sentry.testnet.public.bluzelle.com:1317/nft/${hash}`} target="_blank">
                https://client.sentry.testnet.public.bluzelle.com:1317/nft/{hash}
            </a>
        </div>
        <div style={{padding: 5}}>
            <a href={`https://a.client.sentry.testnet.public.bluzelle.com:1317/nft/${hash}`} target="_blank">
                https://a.client.sentry.testnet.public.bluzelle.com:1317/nft/{hash}
            </a>
        </div>
        <div style={{padding: 5}}>
            <a href={`https://b.client.sentry.testnet.public.bluzelle.com:1317/nft/${hash}`} target="_blank">
                https://b.client.sentry.testnet.public.bluzelle.com:1317/nft/{hash}
            </a>
        </div>
    </>
)


