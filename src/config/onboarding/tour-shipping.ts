import type { DriveStep } from 'driver.js'

export const shippingTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Tarifas de envio',
      description: 'Configura cuanto le costara el envio a tus clientes segun su ubicacion.',
    },
  },
  {
    element: '[data-tour="shipping-tabs"]',
    popover: {
      title: 'Paises habilitados',
      description: 'Las tarifas se organizan por pais. Selecciona un pais para ver sus ubicaciones.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="shipping-add-location"]',
    popover: {
      title: 'Agregar ubicacion',
      description: 'Haz clic aqui para agregar una nueva ubicacion con su tarifa de envio.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="shipping-table"]',
    popover: {
      title: 'Tabla de tarifas',
      description: 'Aqui ves todas las ubicaciones con su precio, tiempo de entrega y estado. Puedes editar cada tarifa haciendo clic en ella.',
      side: 'top',
    },
  },
]
