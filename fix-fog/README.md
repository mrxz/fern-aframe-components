# Fix Fog
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-fix-fog.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-fix-fog)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-fix-fog.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-fix-fog)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This changes the fog depth computation from camera space to world space. This improves the fog effect in VR, most noticeably in case of dense fog. It does this by changing some of the shader chunks of Three.js. For more details, read the dev log: [A-Frame Adventures 02 - Fixing Fog](https://fern.solutions/dev-logs/aframe-adventures-02/)

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/fix-fog) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/fix-fog/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-fix-fog) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-fix-fog/dist/fix-fog.umd.min.js"></script>
```

That's all, it will automatically update the shader chunks :-)