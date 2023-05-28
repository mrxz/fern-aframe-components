# 3DoF component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-3dof.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-3dof)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-3dof.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-3dof)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component allows hud elements to be rendered. The elements render in both desktop and VR mode. On desktop the elements appear on the screen (flat), whereas in VR they are projected on a sphere around the user's head.

The intended usage is mostly for debugging, but can be used for simple overlays as well.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/3dof) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/3dof/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-3dof) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-3dof/dist/3dof.umd.min.js"></script>
```

The `3dof` component can be added to any `a-camera` element as follows:
```HTML
<a-camera 3dof>
</a-camera>
```