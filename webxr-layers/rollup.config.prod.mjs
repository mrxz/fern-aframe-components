import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json' assert { type: 'json' };

export default [
    {
        input: 'src/main.ts',
        plugins: [
            nodeResolve(),
            typescript({ sourceMap: false, compilerOptions: { declaration: true, declarationDir: 'typings' } }),
            terser(),
        ],
        external: ['aframe', 'three'],
        output: [
            {
                name: 'aframe-webxr-layers',
                file: pkg.browser,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE'
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
        output: [{ file: 'dist/aframe-webxr-layers.d.ts', format: "es" }],
        plugins: [dts()],
        external: ['aframe'],
    }
]