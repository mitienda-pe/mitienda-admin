export interface StorePlan {
  id: number
  plan_id: number
  name: string
  expires_at: string
  days_remaining: number
  is_trial: boolean
  status: 'active' | 'expired' | 'trial'
}

export interface PlanModule {
  code: string
  name: string
  group: string
  enabled: boolean
  minimum_plan: string | null
}

export interface PlanQuotas {
  max_products: number
  max_pages: number
  max_users: number
  current_products: number
  current_pages: number
  current_users: number
}

export interface StorePlanInfo {
  plan: StorePlan | null
  modules: PlanModule[]
  quotas: PlanQuotas
}

export interface SubscriptionHistoryItem {
  id: number
  plan_name: string
  detail: string
  start_date: string
  end_date: string
  payment_date: string | null
  price: number
  status: 'active' | 'trial' | 'expired'
  is_trial: boolean
  payment_method: string | null
  reference_code: string
}
