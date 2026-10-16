import type { DriveStep } from 'driver.js'

export const productsTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Crear tu primer producto',
      description:
        'Vamos a recorrer el formulario para que sepas qué campos llenar. Solo el nombre es obligatorio.'
    }
  },
  {
    element: '[data-tour="product-name"]',
    popover: {
      title: 'Nombre del producto',
      description: 'Escribe un nombre claro y descriptivo. Es el único campo obligatorio.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="product-sku"]',
    popover: {
      title: 'SKU y código de barras',
      description:
        'El SKU se genera automáticamente si lo dejas vacío. Útil si manejas inventario.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="product-prices"]',
    popover: {
      title: 'Precios e impuestos',
      description:
        'Ingresa el precio con IGV y el sistema calcula automáticamente el precio sin IGV.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="product-stock"]',
    popover: {
      title: 'Stock',
      description:
        'Indica cuántas unidades tienes disponibles, o marca "Stock ilimitado" si no controlas inventario.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="product-categories"]',
    popover: {
      title: 'Categorías',
      description: 'Selecciona las categorías donde aparecerá el producto en tu tienda.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="product-save"]',
    popover: {
      title: 'Guardar producto',
      description:
        'Cuando estés listo, haz clic en "Crear Producto". Luego podrás agregar imágenes y variantes.',
      side: 'top'
    }
  }
]
