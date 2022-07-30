# Screen Fade component
This component allows the screen to be faded to and from a solid color. The effect works in both desktop and VR mode. This can be used for situations like loading a scene, handling transitions or snap turning.

## Usage
The `screen-fade` component can be attached to the `<a-camera>` as follows:
```
<a-camera screen-fade></a-camera>
```

The fade itself can then be controlled using the `intensity` property.

## Properties
| Name | Type | Default |Description |
| ---- | ---- | ------- |----------- |
| `color` | color | #000000 | The solid color the screen fades to |
| `intensity` | float | 0.0 | The intensity of the fade between 0.0 and 1.0 |
