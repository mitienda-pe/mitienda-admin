/**
 * Roles de un usuario dentro de una tienda (`usuariostipos`).
 *
 * PROPIETARIO es exactamente uno por tienda y no se puede quitar ni eliminar.
 * ADMINISTRADOR ve todos los módulos del plan, igual que el propietario, y
 * gestiona invitados; nombrar administradores es solo del propietario.
 */
export const STORE_ROLE = {
  PROPIETARIO: 1,
  INVITADO: 2,
  ADMINISTRADOR: 3
} as const

export type StoreRole = (typeof STORE_ROLE)[keyof typeof STORE_ROLE]

/** Rol con acceso total: no usa la lista de módulos. */
export function hasFullAccess(tipoId: number): boolean {
  return tipoId === STORE_ROLE.PROPIETARIO || tipoId === STORE_ROLE.ADMINISTRADOR
}

export interface StoreUser {
  id: number
  nombres: string
  apellidos: string
  email: string
  telefono: string
  tipo_id: number
  tipo_nombre: string
  fecha_creacion: string
  fecha_ultimo_ingreso: string | null
}

export interface UserModule {
  id: number
  name: string
  code: string
  group: string
}

export interface StoreUserDetail {
  user: StoreUser
  modules: UserModule[]
  available_modules: UserModule[]
}

export interface InviteUserData {
  email: string
  nombres: string
  apellidos: string
  module_ids: number[]
  /** Rol con el que se invita. Por omisión, invitado. */
  tipo_id?: number
}

export interface InviteResult {
  user_id: number
  status: 'created' | 'existing'
}
