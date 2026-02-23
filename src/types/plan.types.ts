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
}

export interface PlanQuotas {
  max_products: number
  max_pages: number
  current_products: number
  current_pages: number
}

export interface StorePlanInfo {
  plan: StorePlan | null
  modules: PlanModule[]
  quotas: PlanQuotas
}
