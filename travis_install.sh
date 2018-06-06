#!/bin/bash

set -ev

if [ "$daemonIntegration" = true ]; then

  sudo add-apt-repository ppa:ubuntu-toolchain-r/test -y
  sudo apt-get update
  sudo apt-get install --no-install-recommends ca-certificates --allow-unauthenticated bluzelle-swarmdb libstdc++6

  cd test-daemon
  rm daemon-build
  mkdir -p daemon-build/output
  cd daemon-build/output
  ln -s `which swarm`
  cd ../..

else

  # Add SSH Deploy key for swarmemulator

  echo -e "Host *\n\tStrictHostKeyChecking no\n" >> ~/.ssh/config
  echo -e "$SWARMEMULATOR_DEPLOY_KEY" > ~/.ssh/id_rsa
  chmod 600 ~/.ssh/id_rsa
  eval `ssh-agent -s`
  ssh-add ~/.ssh/id_rsa


  # Get the swarmemulator

  npm install ssh://git@github.com/bluzelle/swarmemulator.git#protobuf+ws

fi