#!/bin/bash

set -ev


sudo add-apt-repository ppa:ubuntu-toolchain-r/test -y
sudo apt-get update
sudo -E apt-get -yq --no-install-suggests --no-install-recommends --allow-unauthenticated --allow-downgrades --allow-remove-essential --allow-change-held-packages install g++-7 pkg-config protobuf-compiler libprotobuf-dev
sudo apt-get install --no-install-recommends ca-certificates --allow-unauthenticated bluzelle-swarmdb


cd test-daemon
mkdir -p daemon-build/output
cd daemon-build/output
ln -s `which swarm`
cd ../..