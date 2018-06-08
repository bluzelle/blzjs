<a href="https://bluzelle.com/"><img src='https://raw.githubusercontent.com/bluzelle/api/master/source/images/Bluzelle%20-%20Logo%20-%20Big%20-%20Colour.png' alt="Bluzelle" style="width: 100%"/></a>

See the API at [https://bluzelle.github.io/api](https://bluzelle.github.io/api).

Build Status (branch devel): [![Build Status](https://travis-ci.com/bluzelle/bluzelle-js.svg?branch=devel)](https://travis-ci.com/bluzelle/bluzelle-js)


---------

# Quick Start

## Latest NPM-published version.

1. Run `npm install bluzelle`.
2. Refer to the API page above.


## Development verions.

1. Run `npm install git://github.com/bluzelle/bluzelle-js.git#devel --save` to install the latest development version. 
2. Refer to the API page above, or view the source and `/tests` directory for recent API changes.


-----------

# Testing

## Integration tests against the emulator

1. Fork the swarmemulator repository (private to bluzelle partners).
2. Inside of `swarmemulator`, run `npm link`.
3. Inside of `bluzelle-js`, run `npm link swarmemulator`.
4. `npm run test-node`.


## Integration tests against the daemon

1. Point `test-daemon/daemon-build` to your swarmDB build directory.
2. `npm run test-daemon`.