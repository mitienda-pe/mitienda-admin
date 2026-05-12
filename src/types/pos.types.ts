export type PosCajeroRol = 'cajero' | 'supervisor' | 'administrador'

export interface PosCajeroSucursal {
  tiendadireccion_id: number
  tiendadireccion_nombresucursal: string
}

export interface PosCajero {
  empleado_id: number
  tienda_id: number
  empleado_nombres: string
  empleado_apellidos: string
  empleado_documento: string | null
  empleado_email: string | null
  empleado_telefono: string | null
  empleado_pin: string
  empleado_rol: PosCajeroRol
  empleado_horario_inicio: string | null
  empleado_horario_fin: string | null
  empleado_netsuite_id: string | null
  empleado_activo: 0 | 1
  sucursales?: PosCajeroSucursal[]
  sucursales_ids?: number[]
}

export interface PosCajeroCreatePayload {
  tienda_id: number
  empleado_nombres: string
  empleado_apellidos: string
  empleado_documento?: string | null
  empleado_email?: string | null
  empleado_telefono?: string | null
  empleado_pin: string
  empleado_rol: PosCajeroRol
  empleado_horario_inicio?: string | null
  empleado_horario_fin?: string | null
  empleado_netsuite_id?: string | null
  empleado_activo?: 0 | 1
  sucursales?: number[]
}

export type PosCajeroUpdatePayload = Partial<Omit<PosCajeroCreatePayload, 'tienda_id'>>

export interface PosSucursal {
  tiendadireccion_id: number
  tienda_id: number
  tiendadireccion_nombresucursal: string
  tiendadireccion_direccion: string | null
  tiendadireccion_interior: string | null
  tiendadireccion_telefono: string | null
  tiendadireccion_numero_cajas: number
  tiendadireccion_dist: string | null
  tiendadireccion_prov: string | null
  tiendadireccion_dpto: string | null
  tiendadireccion_netsuite_location_id: string | null
  tiendadireccion_swpublicado: 0 | 1
}

export interface PosSucursalNetsuiteConfig {
  tiendadireccion_id: number
  tiendadireccion_nombresucursal: string
  tiendadireccion_netsuite_location_id: string | null
  serie_boleta_netsuite_id: string | null
  serie_factura_netsuite_id: string | null
  generic_customer_id: string | null
}

export interface PosSucursalesNetsuiteConfigResponse {
  defaults: {
    boleta_netsuite_id: string | null
    factura_netsuite_id: string | null
    generic_customer_id: string | null
  }
  branches: PosSucursalNetsuiteConfig[]
}

export interface PosSucursalNetsuiteUpdate {
  tiendadireccion_netsuite_location_id?: string | null
  serie_boleta_netsuite_id?: string | null
  serie_factura_netsuite_id?: string | null
  generic_customer_id?: string | null
}

export interface CheckPinResult {
  available: boolean
  in_use_by?: string | null
}
