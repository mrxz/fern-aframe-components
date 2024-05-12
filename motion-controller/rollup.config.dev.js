import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default [
    {
        input: 'src/main.ts',
        plugins: [
            nodeResolve({ resolveOnly: ['@webxr-input-profiles/motion-controllers'] }),
            esbuild(),
        ],
        external: ['aframe'],
        output: [
            {
                name: 'aframe-motion-controller',
                file: pkg.browser,
                sourcemap: true,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE',
                    'three/examples/jsm/loaders/GLTFLoader.js': 'THREE',
                }
            }
        ],
    }
]