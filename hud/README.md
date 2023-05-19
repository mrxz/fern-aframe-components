# HUD component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-hud.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-hud)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-hud.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-hud)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component allows hud elements to be rendered. The elements render in both desktop and VR mode. On desktop the elements appear on the screen (flat), whereas in VR they are projected on a sphere around the user's head.

The intended usage is mostly for debugging, but can be used for simple overlays as well.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/hud) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/hud/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-hud) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-hud/dist/hud.umd.min.js"></script>
```

The `a-hud` and `a-hud-element` primitives can be used as children of `<a-camera>` as follows:
```HTML
<a-camera>
    <a-hud>
        <a-hud-element align="center" content-size="1 1" hud-size="0.5" anchor="center"><a-plane></a-plane></a-hud-element>
    </a-hud>
</a-camera>
```