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
            typescript({ compilerOptions: { declaration: true, declarationDir: 'typings' } }),
            terser(),
        ],
        external: ['aframe'],
        output: [
            {
                name: 'aframe-motion-controller',
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
        output: [{ file: 'dist/aframe-motion-controller.d.ts', format: "es" }],
        plugins: [dts()],
        external: ['aframe'],
    }
]