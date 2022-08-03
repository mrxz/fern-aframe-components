import { terser } from "rollup-plugin-terser";
import pkg from './package.json';

export default {
    input: 'src/index.js',
    plugins: [
        terser(),
    ],
    output: [
        {
            name: 'highlight',
            file: pkg.browser,
            format: 'umd',
        },
        {
            file: pkg.module,
            format: 'es'
        },
    ],
};