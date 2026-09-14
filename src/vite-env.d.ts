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

/**
 * PrimeVue 3 no publica tipos para su bus de toasts.
 *
 * Es el mismo canal al que `useToast()` emite por dentro y al que el `<Toast />`
 * de App.vue está suscrito; lo usamos desde el interceptor de axios, que no vive
 * en ningún componente y no puede llamar a `useToast()`. Ver src/utils/toast.ts.
 */
declare module 'primevue/toasteventbus' {
  import type { ToastMessageOptions } from 'primevue/toast'

  const ToastEventBus: {
    emit(event: 'add' | 'remove' | 'remove-group' | 'remove-all-groups', payload?: ToastMessageOptions): void
    on(event: string, listener: (payload?: ToastMessageOptions) => void): void
    off(event: string, listener: (payload?: ToastMessageOptions) => void): void
  }

  export default ToastEventBus
}
