/** Claves de los pasos del checklist "Configura tu tienda" (las define el API). */
export type OnboardingStepKey =
  | 'first_product'
  | 'payments'
  | 'shipping'
  | 'branding'
  | 'share_store'
  | 'choose_plan'

export interface OnboardingStepProgress {
  key: OnboardingStepKey
  done: boolean
  /** false = el paso no aplica a esta tienda (p. ej. elegir plan con un plan pagado). */
  applicable: boolean
  meta: Record<string, unknown>
}

/** GET /onboarding/progress */
export interface OnboardingProgress {
  steps: OnboardingStepProgress[]
  completed_count: number
  total: number
  completed: boolean
  dismissed_at: string | null
  tours_completed: string[]
}

/** Eventos que el API acepta en POST /onboarding/events. */
export type OnboardingEventKey = 'store_link_opened' | 'dismissed' | `tour_completed:${string}`
