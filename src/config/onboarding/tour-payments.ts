import type { DriveStep } from 'driver.js'

export const paymentsTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Formas de pago',
      description:
        'Aquí configuras cómo te van a pagar tus clientes. Puedes activar varias formas de pago a la vez.'
    }
  },
  {
    element: '[data-tour="payment-grid"]',
    popover: {
      title: 'Pasarelas disponibles',
      description:
        'Cada tarjeta representa una pasarela de pago. Haz clic en cualquiera para configurarla con tus credenciales.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="payment-info"]',
    popover: {
      title: 'Consejos importantes',
      description:
        'Recuerda usar el modo de prueba antes de activar en producción. Cada pasarela tiene tarjetas de prueba disponibles.',
      side: 'top'
    }
  }
]
