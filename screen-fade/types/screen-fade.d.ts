import "aframe";

declare module "aframe" {
    import { Component } from "aframe";

    export interface Components {
        /**
         * Component allowing the screen to be faded to and from a solid color.
         * The effect works in both desktop and VR mode. This can be used for situations like
         * loading a scene, handling transitions or snap turning.
         */
        "screen-fade": Component<{
            /** The solid color the screen fades to */
            'color': { type: "color", default: "#000000" },
            /** The intensity of the fade between 0.0 and 1.0 */
            'intensity': { type: "number", default: 0.0, max: 1.0, min: 0.0 }
        }>
    }
}
