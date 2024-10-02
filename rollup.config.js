import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default [
  {
    input: `src/index.ts`,
    plugins: [esbuild()],
    output: [
      {
        file: `dist/index.js`,
        format: 'cjs',
        sourcemap: true,
      },
    ]
  },
  {
    input: `src/index.ts`,
    plugins: [dts()],
    output: {
      file: `dist/index.d.ts`,
      format: 'es',
    },
  },
  // iife bundle for use with pydeck, see https://github.com/visgl/deck.gl/issues/4506
  {
    input: 'src/bundle.js',
    output: {
      file: 'dist/bundle.js',
      format: 'iife',
      name: 'PMTLayerLibrary',
      globals: {
        '@deck.gl/core': 'deck',
        '@deck.gl/layers': 'deck',
        '@luma.gl/core': 'luma'
      }
    },
    external: ['@deck.gl/core', '@deck.gl/layers', '@luma.gl/core'],
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs()
    ]
  }

]