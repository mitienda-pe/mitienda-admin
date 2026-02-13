export interface StoreSeoSettings {
  // Google
  tienda_codigo_google_analytics: string | null
  tienda_google_tagmanager: string | null
  tienda_tag_google_site_verification: string | null
  // SEO
  tienda_metadata_titulo: string | null
  tienda_slogan: string | null
  tienda_meta_img_url: string | null
  // Read-only (computed by backend)
  store_url: string
  sitemap_url: string
  product_feed_url: string
}

export interface StoreSeoUpdate {
  tienda_codigo_google_analytics?: string | null
  tienda_google_tagmanager?: string | null
  tienda_tag_google_site_verification?: string | null
  tienda_metadata_titulo?: string | null
  tienda_slogan?: string | null
}
