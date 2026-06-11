import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import * as Sentry from '@sentry/vue'

import App from './App.vue'
import router from './router'
import { brand } from './config/branding'

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primeicons/primeicons.css'

// Custom styles
import './assets/styles/main.css'

// Onboarding tour styles
import 'driver.js/dist/driver.css'
import './assets/styles/onboarding.css'

const app = createApp(App)

// Sentry error tracking (production only)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    app,
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration({ router }),
    ],
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
    // No enviar PII por defecto (IP, cookies, datos de usuario)
    sendDefaultPii: false,
    // Scrubbing: nunca dejar que el token/cookies de sesión lleguen a Sentry.
    // Los tokens viven en localStorage + header Authorization; los borramos de
    // cualquier contexto de request antes de despachar el evento.
    beforeSend(event) {
      const headers = event.request?.headers as Record<string, string> | undefined
      if (headers) {
        for (const key of Object.keys(headers)) {
          if (/^(authorization|cookie|x-csrf-token)$/i.test(key)) {
            delete headers[key]
          }
        }
      }
      if (event.request?.cookies) delete event.request.cookies
      return event
    },
  })
}

app.use(createPinia())
app.use(router)
app.use(PrimeVue, { ripple: true })
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', err, info)
  if (sentryDsn) {
    Sentry.captureException(err, { extra: { info } })
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason)
  if (sentryDsn) {
    Sentry.captureException(event.reason)
  }
})

// Catch stale module script errors that bypass router.onError
// (e.g., transitive imports from old chunks served as HTML after deploy)
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('MIME type') ||
    event.message?.includes('Failed to fetch dynamically imported module') ||
    event.message?.includes('Importing a module script failed')
  ) {
    const reloadKey = 'chunk-reload:global'
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1')
      window.location.reload()
    }
  }
})

document.title = brand.title
app.mount('#app')
