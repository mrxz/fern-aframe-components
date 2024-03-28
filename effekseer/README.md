# Effekseer component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-effekseer.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-effekseer)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-effekseer.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-effekseer)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component allows integrating [Effekseer](https://effekseer.github.io/en/) effects into A-Frame projects. The effects also work in VR, though not in AR ([EffekseerForWebGL#74](https://github.com/effekseer/EffekseerForWebGL/issues/74)).

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/effekseer) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/effekseer/example/index.html)

## Usage
The setup requires a couple of libraries to be loaded before the component is loaded. For testing the library the below snippet can be copied and used, but for production use it's recommended to bundle your own versions of the relevant dependencies:
```HTML
<!-- The EffekseerForWebGL library from a mirror repository -->
<script src="https://cdn.jsdelivr.net/gh/mrxz/effekseer-sample-effects/effekseer-build/effekseer.min.js"></script>
<!-- (Optional) Zip.js for loading .efkpkg files, without this you will only be able to load .efk files -->
<script src="https://cdn.jsdelivr.net/npm/@zip.js/zip.js/dist/zip.min.js"></script>
<!-- This effekseer component -->
<script src="https://cdn.jsdelivr.net/npm/@fern-solutions/aframe-effekseer/dist/aframe-effekseer.umd.min.js"></script>
```

The `effekseer` system needs to be configured on the `<a-scene>` to load the effekseer wasm:
```HTML
<!-- Load EffekseerForWebGL wasm file from GitHub mirror (test only) -->
<a-scene effekseer="wasmPath: https://cdn.jsdelivr.net/gh/mrxz/effekseer-sample-effects/effekseer-build/effekseer.wasm">
```

Next you can add effects to your scene as follows
```HTML
<a-assets>
    <a-asset-item id="effect-asset" src="path/to/effect.efkpkg" response-type="arraybuffer"></a-asset-item>
</a-assets>
(...)
<a-entity effekseer="src: #effect-asset" position="0 1.5 -10"></a-entity>
```

## Properties
The `effekseer` component supports the following properties:
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `src` | asset | | URL or path to the `.efk` or `.efkpkg` (requires zip.js) |
| `autoplay` | boolean | true | Automatically start playing the effect once loaded |
| `loop` | boolean | false | Restart the effect as soon as it ends |
| `dynamic` | boolean | false | Update the world transform of the effect every tick. Allows the effect to move, rotate and scale along with the entity. Only enabled if you need this behaviour, otherwise leave it disabled for performance reasons |

## Methods
The component exposes a couple of methods for interacting with the effect: `playEffect()`, `pauseEffect()`, `resumeEffect()`, `stopEffect()` and `setTargetLocation(targetLocation: THREE.Vector3)`  
(See example for details on how to use these)