import { ShaderMaterial } from "three";

export class DilationMaterial extends ShaderMaterial {

    constructor() {
        super({
            uniforms: {
                map: { value: null, }
            },
            vertexShader: /*glsl*/`
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /*glsl*/`
                uniform sampler2D map;

                void main() {
                    ivec2 size = textureSize(map, 0);
                    ivec2 texel = ivec2(gl_FragCoord.xy);
                    // Kernel
                    vec4 color = texelFetch(map, texel, 0);
                    if(color.a == 0.0) {
                        for(int x = -5; x <= 5; x++) {
                            for(int y = -5; y <= 5; y++) {
                                vec4 s = texelFetch(map, texel + ivec2(x, y), 0);
                                if(s.a > 0.5) {
                                    color = s;
                                    break;
                                }
                            }
                        }
                    }
                    gl_FragColor = color;
                }
            `
        })
    }

}