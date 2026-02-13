export interface StoreTiktokSettings {
  tienda_tiktok_pixel_id: string | null
  tienda_tiktok_access_token: string | null
  has_access_token: boolean
  // Read-only (computed by backend)
  store_url: string
}

export interface StoreTiktokUpdate {
  tienda_tiktok_pixel_id?: string | null
  tienda_tiktok_access_token?: string | null
}
