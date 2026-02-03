import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import * as Sentry from '@sentry/vue'

import App from './App.vue'
import router from './router'

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primeicons/primeicons.css'

// Custom styles
import './assets/styles/main.css'

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

app.mount('#app')
