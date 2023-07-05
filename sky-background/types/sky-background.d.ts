import "aframe";

declare module "aframe" {
    export interface Components {
        "sky-background": Component<{}>;
    }

    export interface Shaders {
        "sky-background": Shader<{
            /** The solid color of the sky at the top */
            topColor: { type: 'color', is: 'uniform', default: '#0077ff' },
            /** The solid color of the sky at the bottom */
            bottomColor: { type: 'color', is: 'uniform', default: '#ffffff' },
            /** Offset in meters to 'angle' the gradient a bit */
            offset: { type: 'float', is: 'uniform', default: 120.0 },
            /** Exponent used to blend between the top and bottom color as a function of height */
            exponent: { type: 'float', is: 'uniform', default: 0.9 },
            /** The equirectangular texture to use, disables the gradient sky */
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
