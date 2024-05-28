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
        external: ['aframe', 'three', 'three-gpu-pathtracer', 'xatlas'],
        output: [
            {
                name: 'aframe-gpu-pathtracer',
                file: pkg.browser,
                sourcemap: true,
                format: 'umd',
                globals: {
                    aframe: 'AFRAME',
                    three: 'THREE',
                    'three-gpu-pathtracer': 'ThreePathTracer',
                    'Pass_js': 'THREE',
                    'xatlas': 'Module',
                }
            }
        ],
    }
]