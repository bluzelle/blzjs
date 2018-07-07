const api = require('../src/api');
const WebSocketServer = require('websocket').server;
const http = require('http');
const reset = require('./reset');
const assert = require('assert');
const {despawnSwarm, swarm} = require('../test-daemon/setup');

const bluzelle_pb = require('../proto/bluzelle_pb');
const database_pb = require('../proto/database_pb');

const {decode} = require('base64-arraybuffer');


// Run if not testing in browser
(typeof window === 'undefined' ? describe : describe.skip)('redirect', () => {

    beforeEach(reset);

    const followerPort = 8101;
    let httpServer;

    if (process.env.daemonIntegration) {

        afterEach(despawnSwarm);

    }

    before(async () => {

        // Here we're going to mock the daemon with a simple redirect message.

        httpServer = http.createServer();
        await httpServer.listen(followerPort);

        const ws = new WebSocketServer({
            httpServer: httpServer,
            autoAcceptConnections: true
        });


        ws.on('connect', connection =>
            connection.on('message', ({utf8Data}) => {

                debugger;

                const command = JSON.parse(utf8Data);

                if(command['bzn-api'] !== 'database') {
                    assert(false);
                }

                const base64 = command.msg;
                const typedArr = new Uint8Array(decode(base64));

                const db_msg = bluzelle_pb.bzn_msg.deserializeBinary(typedArr).getDb();

                const header = db_msg.getHeader();


                const db_response = new database_pb.database_response();

                db_response.setHeader(header);


                const redirect = new database_pb.database_redirect_response();

                redirect.setLeaderId("137a8403-52ec-43b7-8083-91391d4c5e67");
                redirect.setLeaderName('Sanchez');
                redirect.setLeaderHost(process.env.address);
                redirect.setLeaderPort(process.env.port);

                db_response.setRedirect(redirect);

                connection.sendBytes(Buffer.from(db_response.serializeBinary()));

            }));
    });

    after(() => httpServer.close());



    it('should follow a redirect and send the command to a different socket', async () => {

        api.connect(`ws://${process.env.address}:${followerPort}`, '71e2cd35-b606-41e6-bb08-f20de30df76c');

        await api.create('hey', '123');
        assert(await api.read('hey') === '123');

    });

});
