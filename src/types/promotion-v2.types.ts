// Promotion V2 - Rules-based engine types

export type PromotionV2Status = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired'

export type ActivationType = 'automatic' | 'coupon' | 'referral' | 'permalink' | 'event'

export type ConditionType =
  | 'cart_contains_product'
  | 'cart_contains_category'
  | 'cart_minimum_amount'
  | 'cart_minimum_quantity'
  | 'customer_segment'
  | 'payment_method'
  | 'location'
  | 'first_purchase'

export type EffectType =
  | 'percentage_discount_product'
  | 'percentage_discount_cart'
  | 'fixed_discount_cart'
  | 'free_shipping'
  | 'buy_x_get_y'
  | 'override_price'

export type ConstraintType =
  | 'max_global_uses'
  | 'max_uses_per_user'
  | 'non_stackable'
  | 'schedule_window'
  | 'inventory_limit'

export interface PromotionV2 {
  promotions_v2_id: number
  tienda_id: number
  name: string
  description: string | null
  priority: number
  stackable: number
  exclusive_group: string | null
  status: PromotionV2Status
  starts_at: string
  ends_at: string | null
  created_at: string
  updated_at: string | null
  // Computed counts from list endpoint
  activations_count?: number
  conditions_count?: number
  effects_count?: number
  constraints_count?: number
  coupons_count?: number
  // Nested sub-resources from detail endpoint
  activations?: PromotionV2Activation[]
  conditions?: PromotionV2Condition[]
  effects?: PromotionV2Effect[]
  constraints?: PromotionV2Constraint[]
  coupons?: PromotionV2Coupon[]
}

export interface PromotionV2Activation {
  activation_id: number
  promotions_v2_id: number
  type: ActivationType
  config: Record<string, any> | null
}

export interface PromotionV2Condition {
  condition_id: number
  promotions_v2_id: number
  type: ConditionType
  config: Record<string, any> | null
}

export interface PromotionV2Effect {
  effect_id: number
  promotions_v2_id: number
  type: EffectType
  config: Record<string, any> | null
}

export interface PromotionV2Constraint {
  constraint_id: number
  promotions_v2_id: number
  type: ConstraintType
  config: Record<string, any> | null
}

export interface PromotionV2Coupon {
  coupon_id: number
  tienda_id: number
  promotions_v2_id: number
  code: string
  max_uses: number | null
  max_uses_per_user: number
  used_count: number
  expires_at: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface CreatePromotionV2Data {
  name: string
  description?: string
  priority?: number
  stackable?: number
  exclusive_group?: string
  status?: PromotionV2Status
  starts_at: string
  ends_at?: string
}

export interface UpdatePromotionV2Data {
  name?: string
  description?: string
  priority?: number
  stackable?: number
  exclusive_group?: string
  status?: PromotionV2Status
  starts_at?: string
  ends_at?: string
}

export interface CreateRuleData {
  type: string
  config?: Record<string, any> | null
}

export interface CreateCouponData {
  code: string
  max_uses?: number
  max_uses_per_user?: number
  expires_at?: string
  metadata?: Record<string, any>
}

export interface PromotionV2PaginationParams {
  page?: number
  limit?: number
  search?: string
  status?: PromotionV2Status
  active_only?: boolean
  starts_after?: string
  ends_before?: string
}

// Labels for UI display

export const STATUS_LABELS: Record<PromotionV2Status, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'Activa',
  paused: 'Pausada',
  expired: 'Expirada',
}

export const STATUS_SEVERITY: Record<PromotionV2Status, string> = {
  draft: 'neutral',
  scheduled: 'info',
  active: 'success',
  paused: 'warning',
  expired: 'danger',
}

export const ACTIVATION_TYPE_LABELS: Record<ActivationType, string> = {
  automatic: 'Automática',
  coupon: 'Cupón',
  referral: 'Referido',
  permalink: 'Enlace permanente',
  event: 'Evento',
}

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  cart_contains_product: 'Carrito contiene producto',
  cart_contains_category: 'Carrito contiene categoría',
  cart_minimum_amount: 'Monto mínimo del carrito',
  cart_minimum_quantity: 'Cantidad mínima del carrito',
  customer_segment: 'Segmento de cliente',
  payment_method: 'Método de pago',
  location: 'Ubicación',
  first_purchase: 'Primera compra',
}

export const EFFECT_TYPE_LABELS: Record<EffectType, string> = {
  percentage_discount_product: '% descuento por producto',
  percentage_discount_cart: '% descuento al carrito',
  fixed_discount_cart: 'Descuento fijo al carrito',
  free_shipping: 'Envío gratis',
  buy_x_get_y: 'Compra X lleva Y',
  override_price: 'Precio especial',
}

export const CONSTRAINT_TYPE_LABELS: Record<ConstraintType, string> = {
  max_global_uses: 'Máximo usos globales',
  max_uses_per_user: 'Máximo usos por usuario',
  non_stackable: 'No acumulable',
  schedule_window: 'Ventana horaria',
  inventory_limit: 'Límite de inventario',
}
