import type { DriveStep } from 'driver.js'

export const paymentsTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Formas de pago',
      description: 'Aqui configuras como tus clientes van a pagar. Puedes activar multiples pasarelas a la vez.',
    },
  },
  {
    element: '[data-tour="payment-grid"]',
    popover: {
      title: 'Pasarelas disponibles',
      description: 'Cada tarjeta representa una pasarela de pago. Haz clic en cualquiera para configurarla con tus credenciales.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="payment-info"]',
    popover: {
      title: 'Consejos importantes',
      description: 'Recuerda usar el modo de prueba antes de activar en produccion. Cada pasarela tiene tarjetas de prueba disponibles.',
      side: 'top',
    },
  },
]
