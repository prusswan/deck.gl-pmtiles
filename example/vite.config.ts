import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
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
  plugins: [react()]
})
