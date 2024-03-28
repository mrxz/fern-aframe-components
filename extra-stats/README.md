# Extra Stats component
[![npm version](https://img.shields.io/npm/v/@fern-solutions/aframe-extra-stats.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-extra-stats)
[![npm version](https://img.shields.io/npm/l/@fern-solutions/aframe-extra-stats.svg?style=flat-square)](https://www.npmjs.com/package/@fern-solutions/aframe-extra-stats)
[![github](https://flat.badgen.net/badge/icon/github?icon=github&label)](https://github.com/mrxz/fern-aframe-components/)
[![twitter](https://flat.badgen.net/badge/twitter/@noerihuisman/blue?icon=twitter&label)](https://twitter.com/noerihuisman)
[![mastodon](https://flat.badgen.net/badge/mastodon/@noerihuisman@arvr.social/blue?icon=mastodon&label)](https://arvr.social/@noerihuisman)
[![ko-fi](https://img.shields.io/badge/ko--fi-buy%20me%20a%20coffee-ff5f5f?style=flat-square)](https://ko-fi.com/fernsolutions)

This component expands on the built-in `stats` component with additional stats. It's intended for debugging and development purposes only.

Checkout the example: [Online Demo](https://aframe-components.fern.solutions/extra-stats) | [Source](https://github.com/mrxz/fern-aframe-components/blob/main/extra-stats/example/index.html)

## Usage
Load the script from [npm](https://www.npmjs.com/package/@fern-solutions/aframe-extra-stats) or add the following script tag:
```HTML
<script src="https://cdn.jsdelivr.net/npm/@fern-solutions/aframe-extra-stats/dist/extra-stats.umd.min.js"></script>
```

The `extra-stats` component should be added to an `<a-scene>` and is intended to **_replace_** the `stats` component. Make sure to only add one or the other to the `<a-scene>`. Example:
```HTML
<a-scene extra-stats>
    <!-- scene -->
</a-scene>
```

Properties can be used to enable or disable groups. For example, the following results in a stats panel similar to the built-in one:
```HTML
<a-scene extra-stats="three: true; aframe: true; three-alloc: false">
    <!-- scene -->
</a-scene>
```

**Note:** The properties can't be changed after initialization, as they determin with which plugins rStats is initialized.

## Properties
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `three` | boolean | true | Show the Three.js related stats |
| `aframe` | boolean | true | Show the A-Frame related stats ("Load Time" and "Entities") |
| `three-alloc` | boolean | true | Show the Three.js allocations of various types (Vectors, Matrices, Quaternions and Colors) |
