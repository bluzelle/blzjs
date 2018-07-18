#!/bin/bash

# Should be called from bluzelle-js root directory

cd swarmDB/proto
protoc --js_out=import_style=commonjs,binary:../../proto *.proto