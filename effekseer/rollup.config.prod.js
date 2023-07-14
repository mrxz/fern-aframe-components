import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default [
    {
        input: 'src/main.ts',
        plugins: [
            nodeResolve({ resolveOnly: ['aframe-typescript'] }),
            typescript({ compilerOptions: { declaration: true, declarationDir: 'typings' }, types: ['vendor/effekseer.d.ts'] }),
            terser(),
        ],
        external: ['aframe', 'effekseer'],
        output: [
            {
                name: 'aframe-effekseer',
                file: pkg.browser,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE',
                    "@zip.js/zip.js": "zip"
                }
            },
            {
                file: pkg.module,
                format: 'es'
            },
        ],
    },
    {
        input: './dist/typings/main.d.ts',
        output: [{ file: 'dist/aframe-effekseer.d.ts', format: "es" }],
        plugins: [dts()],
        external: ['aframe', 'effekseer'],
    }
]