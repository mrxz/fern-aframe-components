# Screen Fade component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-screen-fade.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-screen-fade)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-screen-fade.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-screen-fade)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component allows the screen to be faded to and from a solid color. The effect works in both desktop and VR mode. This can be used for situations like loading a scene, handling transitions or snap turning.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/screen-fade) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/screen-fade/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-screen-fade) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-screen-fade/dist/screen-fade.umd.min.js"></script>
```

The `screen-fade` component can be attached to the `<a-camera>` as follows:
```HTML
<a-camera screen-fade></a-camera>
```

The fade itself can then be controlled using the `intensity` property.

## Properties
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `color` | color | #000000 | The solid color the screen fades to |
| `intensity` | float | 0.0 | The intensity of the fade between 0.0 and 1.0 |
