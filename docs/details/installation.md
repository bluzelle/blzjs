# Installation

## NPM

The recommended way of getting bluzelle-js is through the npm package manager. Simply run `npm install bluzelle` and require it in your project with `require('bluzelle');`.

The NPM release reflects the bluzelle-js master branch.

## Building from source

If you are interested in a cutting-edge build of bluzelle-js, or wish to use alternate feature branches, you will have to build from source. This process is very easy.

1. Clone the [bluzelle-js repository](https://github.com/bluzelle/bluzelle-js) and checkout your desired branch. Run `git submodule init` and `git submodule update`. If you checkout to a new branch, be sure to rerun `git submodule update`. 
2. Compile BluzelleESR 
   1. `cd BluzelleESR`
   2. `npm ci`
   3. `npm run truffle compile`
   4. `cd ..` 
3. Run `npm ci` to fetch the project's dependencies.
4. Run `npx webpack` to build the library. The bundled versions, for browser and node environments, will be found in the `lib/` directory.


## Linking from source

Once you have a build, you probably want to use it in a JavaScript project. We will show how to use `npm link` to achieve this goal.

1. In your bluzelle-js directory, run `npm link` to create a package link.
2. In your other project directory, run `npm link bluzelle`.

Now you will be able to use your custom-built version of bluzelle-js exactly the same as if you had downloaded it off NPM.


## Running tests

This repository contains a small set of tests for development purposes. A more comprehensive set of tests may be found at https://github.com/bluzelle/qa. 

The test suite can be run in both node and browser.

1. Build the library
2. Get a swarm to test against. See "Deploying a local swarm" below for instructions on the tools included in this repository.
3. Configure the swarm entry point. Modify `./src/test/connection_config.json` with your preferred entry url and contract address.
4. `npm run test-node`
5. `npm run test-browser`


{% hint style="info" %}
`npm run test-browser` uses the `open` command to open the webpage `./test-browser/mocha.html` in a browser. If you are not on Mac, you may navigate to and open this file manually.
{% endhint %}



## Deploying a local swarm

1. Run `git submodule init` and `git submodule update`.
2. Build `./swarmDB` (See https://github.com/bluzelle/swarmDB). (Note: if building on MacOS, you must apply the patch at the bottom of this document)
3. Run [Ganache GUI](https://www.trufflesuite.com/ganache)
4. Update `./scripts/deploy-ethereum.js:6` to one of the addresses in Ganache GUI.
5. `cd scripts`
6. `./run-swarms.rb 3`. This command will spawn several nodes and print a highlighted contract address.


{% hint style="info" %}
This process has not been verified to work on linux.
{% endhint %}



## SwarmDB patch

```
diff --git a/CMakeLists.txt b/CMakeLists.txt
index d93bd1b..8aff617 100644
--- a/CMakeLists.txt
+++ b/CMakeLists.txt
@@ -36,7 +36,7 @@ add_definitions(-DBOOST_ERROR_CODE_HEADER_ONLY)
 # todo: remove -Wno-implicit-fallthrough once CI moves past gcc 7.4.0...
 set(warnings "-Wno-deprecated-declarations -Wall -Wextra -Werror -Wpedantic -Wno-implicit-fallthrough")
 if (APPLE)
-    set(warnings "${warnings} -Wno-extended-offsetof")
+    set(warnings "${warnings} -Wno-invalid-offsetof")
 else()
     # for beast and gcc release builds...
     if("${CMAKE_BUILD_TYPE}" STREQUAL "Release")
```
