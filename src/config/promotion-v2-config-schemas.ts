/**
 * Promotion V2 - Config field schemas per rule type
 *
 * Defines form fields for each activation/condition/effect/constraint type.
 * Used by RuleConfigForm.vue to render type-specific forms instead of raw JSON.
 */

export type FieldType =
  | 'number'
  | 'currency' // number displayed as soles, stored as centavos
  | 'percentage'
  | 'text'
  | 'product-picker'
  | 'category-picker'
  | 'referral-code-picker'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'weekday-picker'
  | 'time-windows'

export interface SelectOption {
  label: string
  value: string | number
}

export interface ConfigFieldSchema {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  min?: number
  max?: number
  suffix?: string
  helpText?: string
  defaultValue?: any
}

export type RuleCategory = 'activations' | 'conditions' | 'effects' | 'constraints'

// --- ACTIVATION SCHEMAS ---

const activationSchemas: Record<string, ConfigFieldSchema[]> = {
  automatic: [],
  coupon: [],
  referral: [
    {
      key: 'referral_code_ids',
      label: 'Códigos de referido',
      type: 'referral-code-picker',
      required: true,
      helpText: 'Selecciona los códigos de referido que activan esta promoción',
    },
  ],
  permalink: [
    {
      key: 'slug',
      label: 'Slug del enlace',
      type: 'text',
      required: true,
      placeholder: 'black-friday-2026',
      helpText: 'URL amigable para activar la promoción',
    },
  ],
  event: [
    {
      key: 'event_name',
      label: 'Nombre del evento',
      type: 'text',
      required: true,
      placeholder: 'birthday_month',
    },
  ],
}

// --- CONDITION SCHEMAS ---

const conditionSchemas: Record<string, ConfigFieldSchema[]> = {
  cart_contains_product: [
    {
      key: 'product_id',
      label: 'Producto',
      type: 'product-picker',
      required: true,
    },
    {
      key: 'quantity',
      label: 'Cantidad mínima',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
    },
  ],
  cart_contains_category: [
    {
      key: 'category_id',
      label: 'Categoría',
      type: 'category-picker',
      required: true,
    },
    {
      key: 'quantity',
      label: 'Cantidad mínima',
      type: 'number',
      min: 1,
      defaultValue: 1,
    },
  ],
  cart_minimum_amount: [
    {
      key: 'amount',
      label: 'Monto mínimo',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Monto en soles (ej: 50.00)',
    },
  ],
  cart_minimum_quantity: [
    {
      key: 'quantity',
      label: 'Cantidad mínima de productos',
      type: 'number',
      required: true,
      min: 1,
    },
  ],
  customer_segment: [
    {
      key: 'segment',
      label: 'Segmento de cliente',
      type: 'select',
      required: true,
      options: [
        { label: 'Nuevo', value: 'new' },
        { label: 'Recurrente', value: 'returning' },
        { label: 'VIP', value: 'vip' },
        { label: 'Mayorista', value: 'wholesale' },
      ],
    },
  ],
  payment_method: [
    {
      key: 'methods',
      label: 'Métodos de pago',
      type: 'multiselect',
      required: true,
      options: [
        { label: 'Efectivo', value: 'cash' },
        { label: 'Tarjeta de crédito', value: 'credit_card' },
        { label: 'Tarjeta de débito', value: 'debit_card' },
        { label: 'Transferencia bancaria', value: 'bank_transfer' },
        { label: 'Yape / Plin', value: 'mobile_wallet' },
        { label: 'Culqi', value: 'culqi' },
        { label: 'Niubiz', value: 'niubiz' },
        { label: 'MercadoPago', value: 'mercadopago' },
        { label: 'Izipay', value: 'izipay' },
        { label: 'OpenPay', value: 'openpay' },
      ],
    },
  ],
  location: [
    {
      key: 'department',
      label: 'Departamento',
      type: 'text',
      placeholder: 'Lima',
    },
    {
      key: 'province',
      label: 'Provincia',
      type: 'text',
      placeholder: 'Lima',
    },
  ],
  first_purchase: [],
}

// --- EFFECT SCHEMAS ---

const effectSchemas: Record<string, ConfigFieldSchema[]> = {
  percentage_discount_product: [
    {
      key: 'product_id',
      label: 'Producto a descontar',
      type: 'product-picker',
      required: true,
    },
    {
      key: 'percentage',
      label: 'Porcentaje de descuento',
      type: 'percentage',
      required: true,
      min: 1,
      max: 100,
    },
    {
      key: 'max_discount',
      label: 'Descuento máximo',
      type: 'currency',
      helpText: 'Opcional. Límite del descuento en soles',
    },
  ],
  percentage_discount_cart: [
    {
      key: 'percentage',
      label: 'Porcentaje de descuento',
      type: 'percentage',
      required: true,
      min: 1,
      max: 100,
    },
    {
      key: 'max_discount',
      label: 'Descuento máximo',
      type: 'currency',
      helpText: 'Opcional. Límite del descuento en soles',
    },
  ],
  fixed_discount_cart: [
    {
      key: 'amount',
      label: 'Monto de descuento',
      type: 'currency',
      required: true,
      min: 0.01,
      helpText: 'Monto fijo en soles a descontar del carrito',
    },
  ],
  free_shipping: [
    {
      key: 'max_shipping_discount',
      label: 'Descuento máximo de envío',
      type: 'currency',
      helpText: 'Opcional. Dejar vacío para envío gratis total',
    },
  ],
  buy_x_get_y: [
    {
      key: 'trigger_product_id',
      label: 'Producto que se compra',
      type: 'product-picker',
      required: true,
    },
    {
      key: 'trigger_quantity',
      label: 'Cantidad a comprar',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 2,
    },
    {
      key: 'gift_product_id',
      label: 'Producto de regalo',
      type: 'product-picker',
      required: true,
    },
    {
      key: 'gift_quantity',
      label: 'Cantidad de regalo',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
    },
  ],
  override_price: [
    {
      key: 'product_id',
      label: 'Producto',
      type: 'product-picker',
      required: true,
    },
    {
      key: 'new_price',
      label: 'Nuevo precio',
      type: 'currency',
      required: true,
      min: 0,
      helpText: 'Precio especial en soles',
    },
  ],
}

// --- CONSTRAINT SCHEMAS ---

const constraintSchemas: Record<string, ConfigFieldSchema[]> = {
  max_global_uses: [
    {
      key: 'max_uses',
      label: 'Máximo de usos totales',
      type: 'number',
      required: true,
      min: 1,
      helpText: 'Cantidad total de veces que se puede usar esta promoción',
    },
  ],
  max_uses_per_user: [
    {
      key: 'max_uses',
      label: 'Máximo de usos por cliente',
      type: 'number',
      required: true,
      min: 1,
      defaultValue: 1,
    },
  ],
  non_stackable: [],
  schedule_window: [
    {
      key: 'weekdays',
      label: 'Días de la semana',
      type: 'weekday-picker',
      helpText: 'Selecciona los días en que aplica la promoción',
    },
    {
      key: 'time_windows',
      label: 'Ventanas horarias',
      type: 'time-windows',
      helpText: 'Horarios específicos en que aplica',
    },
  ],
  inventory_limit: [
    {
      key: 'max_units',
      label: 'Máximo de unidades',
      type: 'number',
      required: true,
      min: 1,
      helpText: 'Cantidad máxima de unidades que se pueden descontar',
    },
  ],
}

// --- MASTER MAP ---

const allSchemas: Record<RuleCategory, Record<string, ConfigFieldSchema[]>> = {
  activations: activationSchemas,
  conditions: conditionSchemas,
  effects: effectSchemas,
  constraints: constraintSchemas,
}

export function getConfigSchema(
  category: RuleCategory,
  type: string
): ConfigFieldSchema[] | null {
  return allSchemas[category]?.[type] ?? null
}

/** Returns true when the type has fields to render (non-empty schema) */
export function hasConfigFields(category: RuleCategory, type: string): boolean {
  const schema = getConfigSchema(category, type)
  return schema !== null && schema.length > 0
}

/** Returns true when the type is registered in the schema map (even if empty) */
export function isKnownType(category: RuleCategory, type: string): boolean {
  return allSchemas[category]?.[type] !== undefined
}

// --- HUMAN-READABLE FORMATTERS ---

export function formatConfigHuman(
  category: RuleCategory,
  type: string,
  config: Record<string, any> | null
): string {
  if (!config) {
    return getEmptyConfigLabel(category, type)
  }

  switch (type) {
    // Conditions
    case 'cart_minimum_amount':
      return `Monto mínimo: S/ ${formatCentavos(config.amount)}`
    case 'cart_minimum_quantity':
      return `Cantidad mínima: ${config.quantity} producto(s)`
    case 'cart_contains_product':
      return `Producto ID: ${config.product_id}, Cant: ${config.quantity ?? 1}`
    case 'cart_contains_category':
      return `Categoría ID: ${config.category_id}, Cant: ${config.quantity ?? 1}`
    case 'customer_segment':
      return `Segmento: ${config.segment}`
    case 'payment_method':
      return `Métodos: ${(config.methods || []).join(', ')}`
    case 'location':
      return `${config.department || ''}${config.province ? ' / ' + config.province : ''}`
    case 'first_purchase':
      return 'Solo primera compra'

    // Effects
    case 'percentage_discount_product':
      return `${config.percentage}% desc. producto${config.max_discount ? ` (máx S/ ${formatCentavos(config.max_discount)})` : ''}`
    case 'percentage_discount_cart':
      return `${config.percentage}% desc. al carrito${config.max_discount ? ` (máx S/ ${formatCentavos(config.max_discount)})` : ''}`
    case 'fixed_discount_cart':
      return `S/ ${formatCentavos(config.amount)} desc. al carrito`
    case 'free_shipping':
      return config.max_shipping_discount
        ? `Envío gratis (máx S/ ${formatCentavos(config.max_shipping_discount)})`
        : 'Envío gratis'
    case 'buy_x_get_y':
      return `Compra ${config.trigger_quantity}, lleva ${config.gift_quantity} gratis`
    case 'override_price':
      return `Precio especial: S/ ${formatCentavos(config.new_price)}`

    // Constraints
    case 'max_global_uses':
      return `Máx ${config.max_uses} usos totales`
    case 'max_uses_per_user':
      return `Máx ${config.max_uses} usos por cliente`
    case 'non_stackable':
      return 'No acumulable'
    case 'schedule_window': {
      const days = config.weekdays
        ? Object.entries(config.weekdays)
            .filter(([, v]) => v)
            .map(([k]) => k.slice(0, 3))
            .join(', ')
        : 'Todos los días'
      return `Horario: ${days}`
    }
    case 'inventory_limit':
      return `Máx ${config.max_units} unidades`

    // Activations
    case 'automatic':
      return 'Activación automática'
    case 'coupon':
      return 'Requiere cupón'
    case 'referral': {
      const ids = config.referral_code_ids || []
      return ids.length > 0 ? `${ids.length} código(s) de referido` : 'Sin códigos seleccionados'
    }
    case 'permalink':
      return `Enlace: ${config.slug || ''}`
    case 'event':
      return `Evento: ${config.event_name || ''}`

    default:
      return JSON.stringify(config)
  }
}

function getEmptyConfigLabel(_category: RuleCategory, type: string): string {
  switch (type) {
    case 'automatic':
      return 'Activación automática'
    case 'coupon':
      return 'Requiere cupón (ver sección cupones)'
    case 'first_purchase':
      return 'Solo primera compra'
    case 'non_stackable':
      return 'No acumulable con otras promociones'
    case 'free_shipping':
      return 'Envío gratis'
    default:
      return 'Sin configuración adicional'
  }
}

function formatCentavos(value: number | undefined): string {
  if (value === undefined || value === null) return '0.00'
  // If value is already in soles (has decimals or is small), display as-is
  // Config stores amounts in centavos (integers)
  if (Number.isInteger(value) && value > 100) {
    return (value / 100).toFixed(2)
  }
  return Number(value).toFixed(2)
}
