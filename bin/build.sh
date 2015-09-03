#!/usr/bin/env bash

./node_modules/.bin/browserify ./src/jaw.js > ./dist/jaw.js && \
cp ./dist/jaw.js ./example/js/jaw.js
