import "aframe";

declare module "aframe" {
    import { Component, Shader, PrimitiveConstructor } from "aframe";

    export interface Components {
        "sky-background": Component<{}>;
    }

    export interface Shaders {
        "sky-background": Shader<{
            topColor: { type: 'color', is: 'uniform', default: '#0077ff' },
            bottomColor: { type: 'color', is: 'uniform', default: '#ffffff' },
            offset: { type: 'float', is: 'uniform', default: 120.0 },
            exponent: { type: 'float', is: 'uniform', default: 0.9 },
            src: {type: 'map'},
        }>;
    }

    export interface Primitives {
        /**
         * This primitives allows a sky to be added that's either a gradient or an equirectangular skybox.
         * In contrast to the built-in `<a-sky>` this doesn't use a sphere geometry. It renders a fullscreen
         * triangle covering the far plane, ensuring it's always in the background and more performant.
         */
        "a-sky-background": PrimitiveConstructor<'geometry' | 'material' | 'sky-background', {
            'top-color': 'material.topColor',
            'bottom-color': 'material.bottomColor',
            'offset': 'material.offset',
            'exponent': 'material.exponent',
            'src': 'material.src'
        }>;
    }
}
