export type BroadcastPlacement = 'bar' | 'modal'
export type BroadcastSeverity = 'info' | 'warning' | 'danger'

export interface Broadcast {
  id: number
  title: string
  body: string
  placement: BroadcastPlacement
  severity: BroadcastSeverity
  is_dismissible: boolean
  /** Segundos que el aviso debe estar a la vista antes de poder cerrarlo. null = de inmediato. */
  dismiss_delay_seconds: number | null
  /** Tras cerrarlo, vuelve a aparecer pasados estos minutos. null = no vuelve; 0 = en la siguiente pantalla. */
  reshow_after_minutes: number | null
  cta_label: string | null
  cta_url: string | null
  image_url: string | null
  published_at: string
  expires_at: string
}
