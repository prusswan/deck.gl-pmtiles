import { defineConfig } from 'vite';

export default defineConfig({
  // ...
  build: {
    target: 'es2020', // you can also use 'es2020' here
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020', // you can also use 'es2020' here
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      supported: {
        bigint: true
      },
    },
  },
})