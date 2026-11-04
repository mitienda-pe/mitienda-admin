/** Espacios del backoffice donde puede salir un beneficio. */
export type BenefitSlot = 'sidebar' | 'dashboard' | 'orders' | 'products' | 'customers'

/** Desde dónde se hizo clic: un espacio o la página "Beneficios". */
export type BenefitClickSource = BenefitSlot | 'page'

export type BenefitClickAction = 'cta' | 'copy_code'

export interface Benefit {
  id: number
  kind: 'partner' | 'own_app'
  partner_name: string
  title: string
  body: string
  image_url: string | null
  promo_code: string | null
  cta_label: string
  cta_url: string
  slots: BenefitSlot[]
  weight: number
}
