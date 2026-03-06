export interface LoyaltyProgram {
  id?: number
  tienda_id?: number
  type: 'stamps' | 'points'
  is_active: number
  min_order_amount: string
  // Stamps config
  stamps_required: number | null
  stamp_reward_amount: string | null
  // Points config
  points_per_sol: string | null
  point_value_soles: string | null
  min_points_to_pay: number | null
  coupon_expiry_days: number
  created_at?: string
  updated_at?: string
}

export interface LoyaltyAccount {
  id: number
  tienda_id: number
  customer_id: number
  balance_available: string
  balance_reserved: string
  created_at: string
  updated_at: string
  // Joined from tiendasclientes
  tiendacliente_nombres?: string
  tiendacliente_apellidos?: string
  tiendacliente_correo_electronico?: string
}

export interface LoyaltyEntry {
  id: number
  transaction_id: number
  account_id: number
  type: 'earn' | 'reserve' | 'release' | 'redeem' | 'refund' | 'correction'
  debit: string
  credit: string
  prev_hash: string
  hash: string
  created_at: string
  reference: string
  note: string | null
}

export interface LoyaltyDashboard {
  active_customers: number
  earned_last_30days: string
  total_redeemed: string
  rewards_issued: number
  rewards_used: number
  total_liability: string
  liability_soles: string
}

export interface LoyaltyCustomerStatus {
  has_program: boolean
  program_type?: 'stamps' | 'points'
  balance_available?: string
  balance_reserved?: string
  // Stamps
  stamps_required?: number
  stamp_reward_amount?: string
  stamps_current?: number
  stamps_remaining?: number
  // Points
  point_value_soles?: string
  min_points_to_pay?: number
  points_per_sol?: string
  soles_equivalent?: string
  can_pay_with_points?: boolean
  min_order_amount?: string
}

export interface IntegrityResult {
  valid: boolean
  broken_at_entry_id: number | null
  total_entries: number
  message?: string
}

export interface CorrectionPayload {
  credit?: number
  debit?: number
  note: string
}
