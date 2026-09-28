/**
 * Actividad de ingresos de una persona en la tienda (`auth_login_events`).
 *
 * Sirve igual para usuarios del backoffice y para cajeros del POS. Para un
 * usuario, "ingreso" es entrar a ESTA tienda; para un cajero, entrar con PIN.
 * `available: false` significa que la bitácora no respondió, no que no haya
 * ingresos: la pantalla lo dice distinto.
 */
export type LoginChannel = 'backoffice' | 'pos' | 'app'

export interface LoginActivity {
  available: boolean
  totals: {
    last_7_days: number
    last_30_days: number
    last_90_days: number
  }
  by_channel: { channel: LoginChannel; total: number }[]
  daily: { day: string; total: number }[]
  recent: {
    created_at: string
    channel: LoginChannel
    ip: string | null
    user_agent: string | null
  }[]
}
