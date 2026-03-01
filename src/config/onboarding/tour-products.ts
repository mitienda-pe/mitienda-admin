import type { DriveStep } from 'driver.js'

export const productsTourSteps: DriveStep[] = [
  {
    popover: {
      title: 'Crear tu primer producto',
      description: 'Vamos a recorrer el formulario para que sepas que campos llenar. Solo el nombre es obligatorio.',
    },
  },
  {
    element: '[data-tour="product-name"]',
    popover: {
      title: 'Nombre del producto',
      description: 'Escribe un nombre claro y descriptivo. Es el unico campo obligatorio.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="product-sku"]',
    popover: {
      title: 'SKU y codigo de barras',
      description: 'El SKU se genera automaticamente si lo dejas vacio. Util si manejas inventario.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="product-prices"]',
    popover: {
      title: 'Precios e impuestos',
      description: 'Ingresa el precio con IGV y el sistema calcula automaticamente el precio sin IGV.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="product-stock"]',
    popover: {
      title: 'Stock',
      description: 'Indica cuantas unidades tienes disponibles, o marca "Stock ilimitado" si no controlas inventario.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="product-categories"]',
    popover: {
      title: 'Categorias',
      description: 'Selecciona las categorias donde aparecera el producto en tu tienda.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="product-save"]',
    popover: {
      title: 'Guardar producto',
      description: 'Cuando estes listo, haz clic en "Crear Producto". Luego podras agregar imagenes y variantes.',
      side: 'top',
    },
  },
]
