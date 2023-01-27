# Highlight component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-highlight.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-highlight)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-highlight.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-highlight)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component adds a highlight to objects. The highlight can be drawn on either the occluded parts (default) or the visible parts (`mode: visible`). This allows the user to easily and quickly spot them. The highlight consists of accentuating the rim of the object.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/highlight) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/highlight/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-highlight) or add the following script tag:
```HTML
<script src="https://unpkg.com/@fern-solutions/aframe-highlight/dist/highlight.umd.min.js"></script>
```

The `highlight` component can be attached to any object:
```HTML
<a-sphere highlight="rimColor: #FF0000; coreColor: #FF0000; coreOpacity: 0.5"></a-sphere>
```

To ensure certain objects or entities are rendered on top of any highlight (e.g. hands), you can use the `above-highlight` component:
```HTML
<a-entity hand-controls="hand: left" above-highlight></a-entity>
```

## Properties
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `rimColor` | color | #FF0000 | The color at the rim of the object |
| `rimOpacity` | float | 1.0 | The opacity of the rim between 0.0 and 1.0 |
| `coreColor` | color | #000000 | The color at the core of the object |
| `coreOpacity` | float | 0.0 | The opacity of the core between 0.0 and 1.0 |
| `mode` | 'occlusion' or 'visible | occlusion | Whether to show the highlight on occluded or visible parts of the object|

## Caveats
This component tries to be a relatively lightweight and does not introduce any post-processing. Instead it renders the highlighted objects one (or two) more times to achieve the effect. There are however a couple of caveats associated with this:
 1. If the object is expensive to draw, the highlight rendering can be expensive as well
 2. The component uses an `Object3D` directly attached to the scene with `renderOrder` set to 1000. If you make use of `renderOrder` make sure there is no conflict.
 3. When rendering the highlight on occluded parts, the object itself is rendered without proper depth testing, meaning for concave objects the highlight won't always match the outer surface.
 4. Multiple objects with highlights when occluded can render in arbitrary order. It's recommended to limit the amount of entities this effect is used on and try to make sure these entities don't overlap each other.