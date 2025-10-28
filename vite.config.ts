import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom']
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts'
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/core': '/src/core',
      '@/components': '/src/components',
      '@/solvers': '/src/solvers',
      '@/renderers': '/src/renderers',
      '@/types': '/src/types',
      '@/utils': '/src/utils',
      '@/assets': '/src/assets'
    }
  }
})