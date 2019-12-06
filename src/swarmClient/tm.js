const fetch = require('node-fetch');

//tm_endpoint = "http://localhost:26657";
tm_endpoint = "http://localhost:8888";
tx_command = "broadcast_tx_commit?tx=";
query_command = "abci_query?data=";

async function send_request(url)
{
    const response = await fetch(url);
    const myJson = await response.json(); //extract JSON from the http response
    return myJson;
}

async function query(key, callback)
{
    url = tm_endpoint + '/' + query_command + '"' + key + '"';
    res = await send_request(url);
    callback && callback(res);
}

async function send_tx(data, callback)
{
    url = tm_endpoint + '/' + tx_command + '"' + data + '"';
    console.log(url);
    res = await send_request(url);

    // result is within the JSON returned data
    callback && callback(res);
}
