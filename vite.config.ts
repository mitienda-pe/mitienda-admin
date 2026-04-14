import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Read version from package.json + append build hash for cache-busting
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const appVersion = pkg.version
const buildHash = Date.now().toString(36)
const buildId = `${appVersion}+${buildHash}`

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    // Write version.json to public/ so it's served as a static file
    {
      name: 'version-json',
      buildStart() {
        writeFileSync(
          resolve(__dirname, 'public/version.json'),
          JSON.stringify({ version: buildId, buildTime: new Date().toISOString() })
        )
      },
    },
    vue({
      template: {
        compilerOptions: {
          // Cloudflare Stream player uses <stream> custom element
          isCustomElement: (tag) => tag === 'stream' || tag === 'page-builder' || tag === 'ai-text-enhancer'
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
      },
      '/llm-proxy': {
        target: 'https://llmproxy.mitienda.host/index.php/api',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
