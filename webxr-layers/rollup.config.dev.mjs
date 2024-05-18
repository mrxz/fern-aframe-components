import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json' assert { type: 'json' };

export default [
    {
        input: 'src/main.ts',
        plugins: [
            nodeResolve(),
            esbuild(),
        ],
        external: ['aframe', 'three'],
        output: [
            {
                name: 'aframe-webxr-layers',
                file: pkg.browser,
                sourcemap: true,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE'
                }
            }
        ],
    },
]