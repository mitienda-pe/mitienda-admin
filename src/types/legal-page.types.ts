export interface LegalPageSummary {
  slug: string
  title: string
  hasContent: boolean
  contentPreview: string | null
}

export interface LegalPageDetail {
  slug: string
  title: string
  content: string
}
