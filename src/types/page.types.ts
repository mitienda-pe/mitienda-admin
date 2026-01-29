export type PageEditorType = 'wysiwyg' | 'code' | 'visual_builder'

export interface Page {
  id: number
  tienda_id: number
  title: string
  slug: string
  content: string
  editor_type: PageEditorType
  published: boolean
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

export interface PageFormData {
  title: string
  slug?: string
  content?: string
  editor_type: PageEditorType
  published?: boolean
  meta_title?: string
  meta_description?: string
}
