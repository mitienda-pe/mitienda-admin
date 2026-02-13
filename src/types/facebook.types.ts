export interface StoreFacebookSettings {
  tienda_identificadorpixel: string | null
  tienda_fb_capi_token: string | null
  has_capi_token: boolean
  tienda_fb_test_event_code: string | null
  tienda_swintegracionfb: number
  // Read-only (computed by backend)
  store_url: string
  feed_csv_url: string
  feed_xml_url: string
}

export interface StoreFacebookUpdate {
  tienda_identificadorpixel?: string | null
  tienda_fb_capi_token?: string | null
  tienda_fb_test_event_code?: string | null
}
