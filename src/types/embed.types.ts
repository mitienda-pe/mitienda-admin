/**
 * Bloque interactivo: HTML con JavaScript del comerciante que la tienda muestra
 * en un iframe aislado con el shortcode `[embed id="N"]`.
 */
export interface StorefrontEmbed {
  id: number
  name: string
  /** 0 = borrador (solo vista previa), 1 = publicado. */
  status: number
  /** Alto en px que ocupa el bloque hasta que el contenido avisa el suyo. */
  min_height: number
  /** Listo para pegar en una página, un bloque o una descripción. */
  shortcode: string
  /** Ruta del documento, relativa a la base de la API. */
  embed_path: string
  /** Firma que deja ver un borrador. Cambia con cada guardado. */
  preview_token: string
  /** Solo en el detalle. */
  html?: string
  /** Solo en la lista. */
  html_bytes?: number
  created_at: string | null
  updated_at: string | null
}

export interface StorefrontEmbedFormData {
  name: string
  html: string
  status: number
  min_height: number
}
