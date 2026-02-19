export type CardStyle =
  | 'default'
  | 'bordered'
  | 'border-image'
  | 'transparent-info'

export type HoverEffect =
  | 'translate-y'
  | 'scale'
  | 'zoom'
  | 'ken-burns'
  | 'combo'
  | 'info-slide'

export type BorderRadius = 0 | 4 | 8 | 12

export type ButtonType = 0 | 1 | 2 | 4

export type ImageDisplay = 'none' | 'hover-swap' | 'carousel' | 'thumbnails'

export interface ProductCardConfig {
  card_style: CardStyle
  border_radius: BorderRadius
  hover_effect: HoverEffect
  button_type: ButtonType
  image_display: ImageDisplay
  show_color_swatches: boolean
  show_size_buttons: boolean
}

export const DEFAULT_PRODUCT_CARD_CONFIG: ProductCardConfig = {
  card_style: 'default',
  border_radius: 12,
  hover_effect: 'translate-y',
  button_type: 0,
  image_display: 'none',
  show_color_swatches: false,
  show_size_buttons: false
}

export interface CardStyleOption {
  value: CardStyle
  label: string
  description: string
}

export interface HoverEffectOption {
  value: HoverEffect
  label: string
  description: string
}

export interface BorderRadiusOption {
  value: BorderRadius
  label: string
}

export interface ButtonTypeOption {
  value: ButtonType
  label: string
  description: string
  icon: string
}

export const CARD_STYLE_OPTIONS: CardStyleOption[] = [
  {
    value: 'default',
    label: 'Predeterminado',
    description: 'Fondo blanco con sombra sutil'
  },
  {
    value: 'bordered',
    label: 'Con borde',
    description: 'Borde visible sin sombra'
  },
  {
    value: 'border-image',
    label: 'Borde en foto',
    description: 'Borde en la imagen con esquinas redondeadas'
  },
  {
    value: 'transparent-info',
    label: 'Sombra en foto',
    description: 'Sombra en foto, info transparente, esquinas redondeadas'
  }
]

export const HOVER_EFFECT_OPTIONS: HoverEffectOption[] = [
  {
    value: 'translate-y',
    label: 'Elevar',
    description: 'La tarjeta se eleva al pasar el cursor'
  },
  {
    value: 'scale',
    label: 'Escalar',
    description: 'La tarjeta crece ligeramente'
  },
  {
    value: 'zoom',
    label: 'Zoom en imagen',
    description: 'La imagen se amplía dentro del marco'
  },
  {
    value: 'ken-burns',
    label: 'Ken Burns',
    description: 'Zoom lento y sutil en la imagen'
  },
  {
    value: 'combo',
    label: 'Combinado',
    description: 'Escala la tarjeta y zoom en imagen'
  },
  {
    value: 'info-slide',
    label: 'Info deslizable',
    description: 'La información sube revelando detalles'
  }
]

export const BORDER_RADIUS_OPTIONS: BorderRadiusOption[] = [
  { value: 0, label: 'Sin redondeo' },
  { value: 4, label: 'Sutil (4px)' },
  { value: 8, label: 'Moderado (8px)' },
  { value: 12, label: 'Redondeado (12px)' }
]

export interface ImageDisplayOption {
  value: ImageDisplay
  label: string
  description: string
  icon: string
}

export const IMAGE_DISPLAY_OPTIONS: ImageDisplayOption[] = [
  {
    value: 'none',
    label: 'Sin efecto',
    description: 'Solo muestra la imagen principal',
    icon: 'pi pi-image'
  },
  {
    value: 'hover-swap',
    label: 'Cambiar en hover',
    description: 'Muestra la 2da imagen al pasar el cursor',
    icon: 'pi pi-replay'
  },
  {
    value: 'carousel',
    label: 'Carrusel',
    description: 'Navega entre imágenes con flechas',
    icon: 'pi pi-chevron-circle-right'
  },
  {
    value: 'thumbnails',
    label: 'Miniaturas',
    description: 'Muestra miniaturas debajo de la imagen',
    icon: 'pi pi-th-large'
  }
]

export const BUTTON_TYPE_OPTIONS: ButtonTypeOption[] = [
  {
    value: 0,
    label: 'Sin botón',
    description: 'No muestra botón en la tarjeta',
    icon: 'pi pi-minus-circle'
  },
  {
    value: 1,
    label: 'Ver más',
    description: 'Botón para ir al detalle del producto',
    icon: 'pi pi-eye'
  },
  {
    value: 2,
    label: 'Agregar al carrito',
    description: 'Botón que se convierte en stepper al agregar',
    icon: 'pi pi-shopping-cart'
  },
  {
    value: 4,
    label: 'Comprar ahora',
    description: 'Lleva directo al carrito de compras',
    icon: 'pi pi-bolt'
  }
]
