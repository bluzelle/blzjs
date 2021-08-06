import {getSdk} from "../../getSdk";
import {NextApiRequest, NextApiResponse} from "next";
import {API, GasInfo} from "bluzelle"
import {passThrough} from "promise-passthrough";


const defaultGasParams = (gasInfo: GasInfo = {}): GasInfo => ({gas_price: 10, max_gas: 100000000, ...gasInfo})


export default (req: NextApiRequest, res: NextApiResponse) => {
    const body = JSON.parse(req.body);
    const id = Date.now().toString()
    console.log("Request made to Mintable server")
    return getSdk()
        .then(passThrough(() => console.log('Created client')))
        .then((sdk: API) => sdk.createNft(
            id,
            body.hash,
            body.vendor,
            body.userId,
            body.mime,
            'some metadata',
            defaultGasParams()))
        .then(id => {
            console.log(id)
            return res.end(id)
        })
        .catch(e => console.log('ERROR: ', e))
}
