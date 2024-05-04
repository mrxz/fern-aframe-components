import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default [
    {
        input: 'src/main.ts',
        plugins: [
            nodeResolve(),
            typescript({ sourceMap: true }),
        ],
        external: ['aframe', 'effekseer'],
        output: [
            {
                name: 'aframe-effekseer',
                file: pkg.browser,
                sourcemap: true,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE',
                    "@zip.js/zip.js": "zip"
                }
            }
        ],
    }
]