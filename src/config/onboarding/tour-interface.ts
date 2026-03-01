import type { DriveStep } from 'driver.js'

export const interfaceTourSteps: DriveStep[] = [
  {
    element: '[data-tour="header"]',
    popover: {
      title: 'Barra superior',
      description: 'Aqui puedes ver tu tienda actual y acceder a tu perfil de usuario.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Menu de navegacion',
      description: 'Desde aqui accedes a todas las secciones: productos, pedidos, marketing, configuracion y mas.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="main-content"]',
    popover: {
      title: 'Area de contenido',
      description: 'Aqui se muestra el contenido de la seccion que selecciones en el menu.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="help-fab"]',
    popover: {
      title: 'Boton de ayuda',
      description: 'Si necesitas ayuda, presiona este boton. Se abrira una guia contextual segun la pagina en la que estes.',
      side: 'left',
      align: 'end',
    },
  },
]
