import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default [
    {
        input: 'src/main.ts',
        plugins: [
            nodeResolve(),
            typescript({ compilerOptions: { declaration: true, declarationDir: 'typings' } }),
            terser(),
        ],
        external: ['aframe', 'three-gpu-pathtracer'],
        output: [
            {
                name: 'aframe-gpu-pathtracer',
                file: pkg.browser,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE',
                    'three/examples/jsm/postprocessing/Pass.js': 'THREE.Pass'
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
        output: [{ file: 'dist/aframe-gpu-pathtracer.d.ts', format: "es" }],
        plugins: [dts()],
        external: ['aframe', 'three-gpu-pathtracer'],
    }
]