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

    export interface Primitive {
        "a-sky-background": PrimitiveConstructor<'geometry' | 'material' | 'sky-background', {
            'top-color': 'material.topColor',
            'bottom-color': 'material.bottomColor',
            'offset': 'material.offset',
            'exponent': 'material.exponent',
            'src': 'material.src'
        }>;
    }
}
