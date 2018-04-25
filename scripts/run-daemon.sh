#!/usr/bin/env bash

if [ "$1" != "" ]; then
    cd ../../../daemon-build/output; ./swarm -c $1
else
    cd ../../../daemon-build/output; ./swarm
fi

