export type BroadcastPlacement = 'bar' | 'modal'
export type BroadcastSeverity = 'info' | 'warning' | 'danger'

export interface Broadcast {
  id: number
  tienda_id: number | null
  title: string
  body: string
  placement: BroadcastPlacement
  severity: BroadcastSeverity
  is_dismissible: boolean
  cta_label: string | null
  cta_url: string | null
  image_url: string | null
  published_at: string
  expires_at: string
}
