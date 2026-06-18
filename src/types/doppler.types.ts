export interface StoreDopplerSettings {
  tienda_doppler_script_url: string | null
  tienda_doppler_script_ref: string | null
  // Read-only (computed by backend)
  is_installed: boolean
}

export interface StoreDopplerUpdate {
  tienda_doppler_script_url?: string | null
  tienda_doppler_script_ref?: string | null
}
