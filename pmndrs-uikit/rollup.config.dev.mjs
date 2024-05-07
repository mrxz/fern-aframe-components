import esbuild from 'rollup-plugin-esbuild';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json' assert { type: 'json' };

export default [
    {
        input: 'src/main.ts',
        plugins: [
            alias({
                entries: [
                    { find: 'three/src/math/MathUtils.js', replacement: 'super-three/src/math/MathUtils.js' },
                    { find: 'three/examples/jsm/Addons.js', replacement: 'super-three/examples/jsm/Addons.js' },
                    // Preact
                    { find: 'react', replacement: 'preact/compat' },
                    { find: 'react-dom/test-utils', replacement: 'preact/test-utils' },
                    { find: 'react-dom', replacement: 'preact/compat' },
                    { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' },
                    //
                    { find: '@react-three/uikit', customResolver: function() {
                        return './src/kits/uikit-react-adapter.ts';
                    }},
                ],
                customResolver: nodeResolve()
            }),
            nodeResolve({ }),
            json(),
            commonjs({
                include: [
                    "**/node-html-parser/**/*",
                    "**/inline-style-parser/**/*",
                    "**/prettier/plugins/**/*"
                ]
            }),
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