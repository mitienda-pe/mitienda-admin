import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Cloudflare Stream player uses <stream> custom element
          isCustomElement: (tag) => tag === 'stream' || tag === 'page-builder'
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api/v1': {
        target: 'https://api2.mitienda.pe',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/auth': {
        target: 'https://api2.mitienda.pe',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
