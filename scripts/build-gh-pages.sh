#!/bin/bash
set -xe

yarn workspaces foreach -A install --immutable
yarn workspaces foreach -A run build

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

# Insert GitHub corner into example files
find "./dist/" -name "*.html" -exec sed -i '
/<!-- GITHUB_CORNER_LEFT -->/{
    r ./scripts/chunks/github-corner-left.html
    D
}
/<!-- GITHUB_CORNER_RIGHT -->/{
    r ./scripts/chunks/github-corner-right.html
    D
}' {} \;
