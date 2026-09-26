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

/**
 * Nivel de acceso a un módulo concedido (`usuariosmodulos.usuariomodulo_nivel`).
 *
 * LECTURA deja entrar a la pantalla y rechaza cualquier escritura; EDICION es
 * el default de la columna y el comportamiento de siempre, así que un permiso
 * sin nivel explícito sigue pudiendo modificar.
 */
export const MODULE_LEVEL = {
  LECTURA: 1,
  EDICION: 2
} as const

export type ModuleLevel = (typeof MODULE_LEVEL)[keyof typeof MODULE_LEVEL]

export interface UserModule {
  id: number
  name: string
  code: string
  group: string
  /** Solo lo traen los módulos concedidos, no el catálogo de disponibles. */
  level?: ModuleLevel
}

/** Sucursal/almacén de la tienda (`tiendasdirecciones`). */
export interface StoreBranch {
  id: number
  name: string
}

export interface StoreUserDetail {
  user: StoreUser
  modules: UserModule[]
  available_modules: UserModule[]
  /**
   * Sucursales asignadas. **Vacío = puede operar en TODAS**, que es el default
   * de la plataforma; no significa "en ninguna".
   */
  branches?: StoreBranch[]
  available_branches?: StoreBranch[]
}

export interface InviteUserData {
  email: string
  nombres: string
  apellidos: string
  module_ids: number[]
  /** modulo_id => nivel. Lo que no venga se concede en EDICION. */
  module_levels?: Record<number, ModuleLevel>
  /** Sucursales en las que puede operar. Vacío u omitido = todas. */
  branch_ids?: number[]
  /** Rol con el que se invita. Por omisión, invitado. */
  tipo_id?: number
}

export interface InviteResult {
  user_id: number
  status: 'created' | 'existing'
}
