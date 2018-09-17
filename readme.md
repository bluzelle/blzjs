<a href="https://bluzelle.com/"><img src='https://raw.githubusercontent.com/bluzelle/api/master/source/images/Bluzelle%20-%20Logo%20-%20Big%20-%20Colour.png' alt="Bluzelle" style="width: 100%"/></a>

See the API at [https://devel-docs.bluzelle.com/bluzelle-js/](https://devel-docs.bluzelle.com/bluzelle-js/).

Build Status (branch devel): [![Build Status](https://travis-ci.com/bluzelle/bluzelle-js.svg?branch=devel)](https://travis-ci.com/bluzelle/bluzelle-js)


---------

# Quick Start

## Latest NPM-published version.

1. Run `npm install bluzelle`.
2. Refer to the API page above.


## Development verions.

1. Clone this repository.
2. Run `npm install` to install dependencies.
3. Run `webpack` to build the project. Output files should go in the `dist/` directory.
4. Run `npm link`.
5. In your client project, run `npm link bluzelle-js`.


-----------

# Testing

## Integration tests against the emulator

1. Complete steps 1-3 in the development checklist above.
2. Clone the swarmemulator repository (private to bluzelle partners).
3. Inside of `swarmemulator`, run `npm link`.
4. Inside of `bluzelle-js`, run `npm link swarmemulator`.
5. Inside of `bluzelle-js`, run `npm run test-node`.


## Integration tests against the daemon

1. Point `test-daemon/daemon-build` to your swarmDB build directory.
2. `npm run test-daemon`.