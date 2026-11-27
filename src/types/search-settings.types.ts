export interface StoreSearchSettings {
  strict_mode: boolean
  /** Cada grupo es una lista de términos equivalentes entre sí. */
  synonyms: string[][]
  limits?: {
    max_groups: number
    max_terms_per_group: number
    min_term_length: number
    max_term_length: number
  }
  search_engine_synced?: boolean
}

export interface StoreSearchSettingsUpdate {
  strict_mode: boolean
  synonyms: string[][]
}
