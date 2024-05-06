import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import pkg from './package.json';

export default [
    {
        input: 'src/main.ts',
        plugins: [
            alias({
                entries: {
                    'three/src/math/MathUtils.js': 'super-three/src/math/MathUtils.js',
                    'three/examples/jsm/Addons.js': 'super-three/examples/jsm/Addons.js'
                },
                customResolver: nodeResolve()
            }),
            nodeResolve({ }),
            esbuild(),
        ],
        external: ['aframe', 'three'],
        output: [
            {
                name: 'aframe-pmndrs-uikit',
                file: pkg.browser,
                sourcemap: true,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE'
                }
            }
        ],
    }
]