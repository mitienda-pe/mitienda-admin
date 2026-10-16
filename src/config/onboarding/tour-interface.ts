import type { DriveStep } from 'driver.js'

export const interfaceTourSteps: DriveStep[] = [
  {
    element: '[data-tour="header"]',
    popover: {
      title: 'Barra superior',
      description: 'Aquí puedes ver tu tienda actual y acceder a tu perfil de usuario.',
      side: 'bottom',
      align: 'center'
    }
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Menú de navegación',
      description:
        'Desde aquí accedes a todas las secciones: productos, pedidos, marketing, configuración y más.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="main-content"]',
    popover: {
      title: 'Área de contenido',
      description: 'Aquí se muestra el contenido de la sección que selecciones en el menú.',
      side: 'left',
      align: 'start'
    }
  },
  {
    element: '[data-tour="help-fab"]',
    popover: {
      title: 'Botón de ayuda',
      description:
        'Si necesitas ayuda, presiona este botón. Se abrirá una guía contextual según la página en la que estés.',
      side: 'left',
      align: 'end'
    }
  }
]
