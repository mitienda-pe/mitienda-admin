export type CardStyle =
  | 'default'
  | 'bordered'
  | 'border-image'
  | 'transparent-info'
  | 'shadow-image'

export type HoverEffect =
  | 'translate-y'
  | 'scale'
  | 'zoom'
  | 'ken-burns'
  | 'combo'
  | 'info-slide'

export type BorderRadius = 0 | 4 | 8 | 12

export type ButtonType = 0 | 1 | 2 | 3 | 4

export interface ProductCardConfig {
  card_style: CardStyle
  border_radius: BorderRadius
  hover_effect: HoverEffect
  button_type: ButtonType
  image_hover_swap: boolean
}

export const DEFAULT_PRODUCT_CARD_CONFIG: ProductCardConfig = {
  card_style: 'default',
  border_radius: 12,
  hover_effect: 'translate-y',
  button_type: 0,
  image_hover_swap: false
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
    description: 'Borde solo en la imagen'
  },
  {
    value: 'transparent-info',
    label: 'Info transparente',
    description: 'Fondo transparente, sombra en foto'
  },
  {
    value: 'shadow-image',
    label: 'Sombra en foto',
    description: 'Sombra solo en la imagen'
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
    label: 'Cantidad',
    description: 'Selector de cantidad + agregar',
    icon: 'pi pi-sort-numeric-up'
  },
  {
    value: 3,
    label: 'Sumar',
    description: 'Botón "+" para agregar rápido',
    icon: 'pi pi-plus-circle'
  },
  {
    value: 4,
    label: 'Agregar al carrito',
    description: 'Botón completo de agregar al carrito',
    icon: 'pi pi-shopping-cart'
  }
]
