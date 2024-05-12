import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json' assert { type: 'json' };

export default [
    {
        input: 'src/main.ts',
        plugins: [
            alias({
                entries: [
                    { find: 'three/src/math/MathUtils.js', replacement: 'super-three/src/math/MathUtils.js' },
                    { find: 'three/examples/jsm/Addons.js', replacement: 'super-three/examples/jsm/Addons.js' }
                ],
                customResolver: nodeResolve()
            }),
            nodeResolve({}),
            commonjs({
                include: [
                    "**/node-html-parser/**/*",
                    "**/inline-style-parser/**/*",
                    "**/prettier/plugins/**/*",
                    // Needed for HTML2Code conversion
                    "**/css-select/lib/**/*",
                    "**/domutils/lib/**/*",
                    "**/domhandler/lib/**/*",
                    "**/domelementtype/lib/**/*",
                    "**/dom-serializer/lib/**/*",
                    "**/entities/lib/**/*",
                    "**/boolbase/*",
                    "**/nth-check/lib/**/*",
                    "**/he/**/*",
                ]
            }),
            typescript({ sourceMap: false, compilerOptions: { declaration: true, declarationDir: 'typings' } }),
            terser(),
        ],
        external: ['aframe', 'three'],
        output: [
            {
                name: 'aframe-pmndrs-uikit',
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
        output: [{ file: 'dist/aframe-pmndrs-uikit.d.ts', format: "es" }],
        plugins: [dts()],
        external: ['aframe'],
    }
]