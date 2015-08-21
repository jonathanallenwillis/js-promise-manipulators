#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NORMAL='\033[0m'

error() {
    echo -e "[${RED}ERROR${NORMAL}] $*"
}
info() {
    echo -e "[${GREEN}INFO${NORMAL}] $*"
}

exists() {
    if command -v "$1" > /dev/null 2>&1; then
        info Found: $1.
        return 0
    else
        error Missing: $1
        return 1
    fi
}

run_tests() {
    if exists mocha; then
        mocha tests --recusive "$@"
    fi
}

run_tests "$@"