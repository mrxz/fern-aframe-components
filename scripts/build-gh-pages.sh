#!/bin/bash
set -xe

yarn workspaces foreach install --immutable
yarn workspaces foreach run build

rm -rf ./dist
mkdir -p ./dist/js/
cp README.md ./dist/
for dir in ./*/
do
    dir=$(basename $dir)
    if [ -e "./$dir/package.json" ]; then
        mkdir -p "./dist/$dir/"
        cp -R "./$dir/dist/"*".umd.min.js" ./dist/js/
        cp -R "./$dir/example/"* "./dist/$dir/"
    fi
done
