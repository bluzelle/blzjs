import {
    APIAndSwarm,
    createKeys,
    DEFAULT_TIMEOUT,
    sentryWithClient,
    createAccounts,
    fundAccounts,
    verifyKeys,
    Config,
    createMultiClientKeys
} from "../helpers/client-helpers";

const config = new Config();

describe('multiple clients in parallel', function (){
   this.timeout(DEFAULT_TIMEOUT);
   let bz: APIAndSwarm;

   beforeEach(() => sentryWithClient()
       .then(db => bz = db)
   );

   //Ask Scott about this test
   it(`should be able to handle ${config.NUMBER_OF_KEYS} creates from ${config.NUMBER_OF_CLIENTS} parallel clients`, async () => {
        await createAccounts(bz, config.NUMBER_OF_CLIENTS)
            .then(fundAccounts(bz, config))
            .then(accounts => Promise.all(accounts.map(createMultiClientKeys(config))))
            .then(accountsAndTimes => accountsAndTimes.map((x: any) => x.account))
            .then(verifyKeys(config)); // This function runs multiple expects to verify keys
    });
});
