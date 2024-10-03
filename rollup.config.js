import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

import typescript from "@rollup/plugin-typescript";
import alias from '@rollup/plugin-alias';
import replace from '@rollup/plugin-replace';

// from https://github.com/rollup/plugins/issues/440
const addSyntheticNamedExportsToSkippedNodeImports = () => ({
  load: (importee) => {
    if (importee === '\u0000node-resolve:empty.js') {
      return {code: 'export default {};', syntheticNamedExports: true};
    } else {
      return null;
    }
  }
});

export default [
  // common js
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
    input: `src/index.ts`,
    //input: 'src/bundle.js',
    //input: 'dist/index.js',
    output: {
      // output.file must be under compilerOptions.outDir, see https://github.com/rollup/plugins/issues/243
      file: 'example/public/dist/bundle.js',
      format: 'iife',
      sourcemap: true,
      name: 'PMTLayerLibrary',
      globals: {
        '@deck.gl/core': 'deck',
        '@deck.gl/layers': 'deck',
        '@luma.gl/core': 'luma'
      }
    },
    external: ['@deck.gl/core', '@deck.gl/layers', '@luma.gl/core'],
    plugins: [
      typescript(),
      alias({
        entries: {}
      }),
      addSyntheticNamedExportsToSkippedNodeImports(),
      // for loaders.gl on non-node/iife builds, see https://github.com/visgl/loaders.gl/issues/2000
      resolve({
        browser: true,
        preferBuiltins: false,
        mainFields: ["browser", "main"]
      }),
      // process.env not resolvable in browser, see https://github.com/rollup/rollup/issues/487
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        __buildDate__: () => JSON.stringify(new Date()),
      }),
      commonjs()
    ]
  }
]