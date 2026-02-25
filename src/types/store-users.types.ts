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
}

export interface InviteResult {
  user_id: number
  status: 'created' | 'existing'
}
