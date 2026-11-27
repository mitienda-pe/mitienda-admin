import type { PageSection } from './template-section.types'

// `blocks`: la página se arma con secciones y bloques, como la plantilla. Su
// `content` es el JSON {"sections":[...]} (ver PageBlocksLayout).
export type ContentEditorType = 'wysiwyg' | 'code' | 'visual_builder'
export type PageEditorType = ContentEditorType | 'blocks'

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

/**
 * Layout de una página `blocks`, tal como se guarda en `content`.
 * Mismo formato de secciones que la Plantilla.
 */
export interface PageBlocksLayout {
  sections: PageSection[]
}

/** Secciones de una página de bloques; `null` si el contenido no tiene esa forma. */
export function parsePageBlocksLayout(content: string): PageSection[] | null {
  if (!content.trim()) return []
  try {
    const parsed = JSON.parse(content) as Partial<PageBlocksLayout>
    return Array.isArray(parsed?.sections) ? parsed.sections : null
  } catch {
    return null
  }
}

export function serializePageBlocksLayout(sections: PageSection[]): string {
  const layout: PageBlocksLayout = { sections }
  return JSON.stringify(layout)
}
