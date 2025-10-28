import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Cloudflare Stream player uses <stream> custom element
          isCustomElement: (tag) => tag === 'stream'
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
    port: 3000,
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
