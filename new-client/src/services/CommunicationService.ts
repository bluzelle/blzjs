import {GasInfo} from "../GasInfo";
import {Identity} from "monet";

const TOKEN_NAME = 'ubnt';

let txQueueTail = Promise.resolve();

export const sendTx = (api: any, msgs: any[], memo: string, gasInfo: GasInfo): Promise<any> =>
    txQueueTail = txQueueTail.then(() =>
        api.cosmos.getAccounts(api.address).then((data: any) =>
            Identity.of({
                msgs: msgs,
                chain_id: api.chainId,
                fee: getFeeInfo(gasInfo),
                memo: memo,
                account_number: String(data.result.value.account_number),
                sequence: String(data.result.value.sequence)
            })
                .map(api.cosmos.newStdMsg.bind(api.cosmos))
                .map((stdSignMsg: any) => api.cosmos.sign(stdSignMsg, api.ecPairPriv, 'block'))
                .map(api.cosmos.broadcast.bind(api.cosmos))
                .join()
        )
    )


const getFeeInfo = ({max_fee, gas_price = 10, max_gas = 200000}: GasInfo) => ({
    amount: [{
        denom: TOKEN_NAME,
        amount: (max_fee ? max_fee : max_gas * gas_price).toString()

    }],
    gas: max_gas.toString()
});


