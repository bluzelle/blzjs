## Bluzelle JS client REPL

For use in learning about and experimenting with the JS client for the  Bluzelle database.

### Quickstart
##### in /repl
* `yarn` or `npm install`
* `yarn start` or `npm run start`

### About

The REPL is a full Javascript environment, you can run 
any JS code or command that you would in the NodeJS REPL (actually it uses the NodeJS REPL)

### Example
```
   Bluzelle REPL
   To see a list of commands or get help with a specific command type ".help [command]"
   > gas = {gas_price: 10}
   { gas_price: 10 }
   > key = 'foo'
   'foo'
   > await create(key, 'bar', gas)
   undefined
   >  await read(key)
   'bar'
   > 
``` 