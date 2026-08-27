/**
 * Cobro de la suscripción del comercio a MiTienda (motor billing_*).
 *
 * Distinto de billing.types.ts, que es la facturación electrónica que el
 * comercio le emite a SUS compradores.
 */

export interface BillingGatewayConfig {
  gateway: 'mercadopago'
  public_key: string
  /** false = la plataforma todavía no tiene credenciales cargadas */
  configured: boolean
  currency: string
  locale: string
}

export interface BillingPaymentMethod {
  id: number
  card_brand: string | null
  card_last_four: string | null
  card_exp_month: number | null
  card_exp_year: number | null
  cardholder_name: string | null
  is_default: 0 | 1
  status: 'active' | 'expired' | 'removed'
  created_at: string
}

export interface BillingSubscription {
  id: number
  status: 'trialing' | 'active' | 'past_due' | 'grace_period' | 'suspended' | 'scheduled_cancel' | 'canceled'
  payment_type: 'automatic' | 'manual' | null
  current_period_end: string | null
  next_charge_at: string | null
  amount_centavos: number
  amount_display: string
  currency: string
  plan?: { name: string; slug: string } | null
}

/** Datos que el titular tipea; el número de tarjeta nunca pasa por acá. */
export interface CardholderInput {
  cardholderName: string
  identificationType: string
  identificationNumber: string
}
