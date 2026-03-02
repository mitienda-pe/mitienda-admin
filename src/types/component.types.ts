export type ComponentEditorType = 'wysiwyg' | 'code' | 'visual_builder'

export interface StoreComponent {
  id: number
  tienda_id: number
  code: string
  type_id: number
  type_name: string
  name: string
  active: boolean
  created_at: string
  editor_type: ComponentEditorType
  html_content?: string
  html_record_id?: number | null
}

export interface ComponentCreateData {
  name: string
  code?: string
  editor_type: ComponentEditorType
}

export interface ComponentUpdateData {
  name?: string
  active?: boolean
  html_content?: string
}
