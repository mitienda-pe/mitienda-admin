import type { DriveStep } from 'driver.js'

export const shippingTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Tarifas de envío',
      description:
        'Configura cuánto le costará el envío a tus clientes según su ubicación. Si prefieres que recojan en tu local, activa el recojo en tienda en la configuración de envíos.'
    }
  },
  {
    element: '[data-tour="shipping-tabs"]',
    popover: {
      title: 'Países habilitados',
      description:
        'Las tarifas se organizan por país. Selecciona un país para ver sus ubicaciones.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="shipping-add-location"]',
    popover: {
      title: 'Agregar ubicación',
      description: 'Haz clic aquí para agregar una nueva ubicación con su tarifa de envío.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="shipping-table"]',
    popover: {
      title: 'Tabla de tarifas',
      description:
        'Aquí ves todas las ubicaciones con su precio, tiempo de entrega y estado. Puedes editar cada tarifa haciendo clic en ella.',
      side: 'top'
    }
  }
]
