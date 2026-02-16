export interface StoreComponent {
  id: number
  tienda_id: number
  code: string
  type_id: number
  type_name: string
  name: string
  active: boolean
  created_at: string
  html_content?: string
  html_record_id?: number | null
}

export interface ComponentUpdateData {
  name?: string
  active?: boolean
  html_content?: string
}
