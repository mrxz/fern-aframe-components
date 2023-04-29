# Mirror component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-mirror.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-mirror)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-mirror.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-mirror)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

The `mirror` component and corresponding `<a-mirror>` primitive allows a high-quality mirror to be added to your A-Frame scenes with ease. Instead of rendering to a texture, it uses a stencil buffer and renders directly into the framebuffer resulting in a high-quality mirror. It works in both desktop and VR mode.

Inspiration for this came from a snippet from Carmack's Unscripted talk during the Meta Connect 2022 (emphasis mine):
> Almost all the mirrors that you see in VR games are done by rendering a separate view and they're usually **blurrier, aliased, generally not particularly high quality**. While in Home we're doing a neat little trick which is actually what I was doing all the way back in the Doom 3 game, where you sort of flip the world around, render through that cut-out and you can get as high a quality in the mirror as you get looking at things directly.  
> Source: https://www.youtube.com/watch?v=ouq5yyzSiAw&t=892s

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/mirror) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/mirror/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-mirror) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-mirror/dist/mirror.umd.min.js"></script>
```

The `a-mirror` primitive can be added to your scene as follows:
```HTML
<a-mirror position="0 1.2 -3" scale="1 2 1" rotation="0 180 0"></a-mirror>
```

Additionally layers can be specified to show or hide objects in the mirror view. For example, you might want to render the avatar of the user only in the mirror and not the main camera view.

## Properties
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `layers` | array | [0] | List of layers that should be enabled when rendering the mirror view |

## Limitations
* Mirrors are not rendered recursively, so any mirror seen from another mirror will just render as an opaque plane
* Avoid mixing transparency with mirrors (e.g. looking at a mirror through transparent objects). Depending on the render-order this either results in the overlap being an opaque mirror or the transparent object not being visible.
