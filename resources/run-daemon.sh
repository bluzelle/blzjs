#!/usr/bin/env bash

if [ "$1" != "" ]; then
    # echo "Positional parameter 1 contains something"
    cd ../../../daemon-build/output; ./swarm -c $1
else
    # echo "Positional parameter 1 is empty"
    cd ../../../daemon-build/output; ./swarm
fi

