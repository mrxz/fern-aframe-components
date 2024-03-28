# 3DoF component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-3dof.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-3dof)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-3dof.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-3dof)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component can be used to render a scene in either monoscopic or stereoscopic 3DoF. Only the orientation of the head is used. The position of the camera can be controlled with the position property.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/3dof) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/3dof/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-3dof) or add the following script tag:
```HTML
<script src="https://cdn.jsdelivr.net/npm/@fern-solutions/aframe-3dof/dist/3dof.umd.min.js"></script>
```

The `3dof` component can be added to any `a-scene` element as follows:
```HTML
<a-scene 3dof="position: 0 1.6 0">
```