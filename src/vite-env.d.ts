/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __BUILD_ID__: string

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_CDN_URL: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_TEST_EMAIL: string
  readonly VITE_TEST_PASSWORD: string
  readonly VITE_POS_URL: string
}


interface ImportMeta {
  readonly env: ImportMetaEnv
}
