# Sky Background component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-sky-background.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-sky-background)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-sky-background.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-sky-background)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This primitives allows a sky to be added that's either a gradient or an equirectangular skybox. In contrast to the built-in `<a-sky>` this doesn't use a sphere geometry. It renders a fullscreen triangle covering the far plane, ensuring it's always in the background and more performant.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/sky-background) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/sky-background/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-sky-background) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-sky-background/dist/sky-background.umd.min.js"></script>
```

The `<a-sky-background>` primitive can be used as follows:
```HTML
<a-sky-background top-color="#0077ff" bottom-color="#ffffff"></a-sky-background>
```
Instead of a gradient sky, an equirectangular skybox texture can be used as well:
```HTML
<a-sky-background src="url(./textures/sky.png)"></a-sky-background>
```

## Attributes
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `top-color` | color | #0077ff | The solid color of the sky at the top |
| `bottom-color` | color | #ffffff | The solid color of the sky at the bottom |
| `offset` | number | 120 | Offset in meters to 'angle' the gradient a bit |
| `exponent` | number | 0.9 | Exponent used to blend between the top and bottom color as a function of height |
| `src` | map | null | The equirectangular texture to use, disables the gradient sky |

