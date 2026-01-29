import type { PageEditorType } from './page.types'

export interface BlogPost {
  id: number
  tienda_id: number
  category_id: number | null
  category_name: string | null
  image_id: number | null
  title: string
  slug: string
  description: string
  excerpt: string
  content: string
  editor_type: PageEditorType
  active: boolean
  published: boolean
  publication_date: string
  author: string
  created_at: string
  updated_at: string | null
}

export interface BlogPostFormData {
  title: string
  slug?: string
  description?: string
  excerpt?: string
  content?: string
  editor_type: PageEditorType
  category_id?: number | null
  published?: boolean
  publication_date?: string
  author?: string
}

export interface BlogCategory {
  id: number
  tienda_id: number
  name: string
  slug: string
}

export interface BlogCategoryFormData {
  name: string
}
