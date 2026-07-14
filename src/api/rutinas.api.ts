import axios from './axios'

// ─── Tipos del árbol de rutina (régimen → área → paso → productos) ──

export interface RutinaProducto {
  producto_id: number
  producto_nombre?: string
  producto_precio?: number
  producto_imagen?: string | null
  producto_slug?: string
  tiendarutinaproducto_orden?: number
}

export interface RutinaPaso {
  tiendarutinapaso_id?: number
  tiendarutinapaso_nombre: string
  tiendarutinapaso_subtitulo?: string | null
  tiendarutinapaso_orden?: number
  productos: RutinaProducto[]
}

export interface RutinaArea {
  tiendarutinaarea_id?: number
  tiendarutinaarea_nombre: string
  tiendarutinaarea_subtitulo?: string | null
  tiendarutinaarea_icono?: string | null
  tiendarutinaarea_orden?: number
  pasos: RutinaPaso[]
}

export interface Rutina {
  tiendarutina_id: number
  tienda_id: number
  tiendarutina_nombre: string
  tiendarutina_slug?: string | null
  tiendarutina_descripcion?: string | null
  tiendarutina_tipopiel?: string | null
  tiendarutina_mostrar_siempre: number
  tiendarutina_activo: number
  tiendarutina_orden?: number
  areas?: RutinaArea[]
}

// Payload de guardado: el backend acepta el árbol completo y lo reemplaza.
// `productos` puede enviarse como lista de IDs (el backend valida ownership).
export interface RutinaSavePayload {
  tiendarutina_nombre: string
  tiendarutina_descripcion?: string | null
  tiendarutina_tipopiel?: string | null
  tiendarutina_mostrar_siempre?: number
  tiendarutina_activo?: number
  areas?: Array<{
    tiendarutinaarea_nombre: string
    tiendarutinaarea_subtitulo?: string | null
    tiendarutinaarea_icono?: string | null
    pasos: Array<{
      tiendarutinapaso_nombre: string
      tiendarutinapaso_subtitulo?: string | null
      productos: number[]
    }>
  }>
}

interface ListParams {
  page?: number
  per_page?: number
  search?: string
}

export const rutinasApi = {
  async getAll(params: ListParams = {}): Promise<{ data: Rutina[]; meta: any }> {
    const response = await axios.get('/rutinas', { params })
    return { data: response.data.data, meta: response.data.meta }
  },

  async getById(id: number): Promise<Rutina> {
    const response = await axios.get(`/rutinas/${id}`)
    return response.data.data
  },

  async create(payload: RutinaSavePayload): Promise<Rutina> {
    const response = await axios.post('/rutinas', payload)
    return response.data.data
  },

  async update(id: number, payload: RutinaSavePayload): Promise<Rutina> {
    const response = await axios.put(`/rutinas/${id}`, payload)
    return response.data.data
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`/rutinas/${id}`)
  },

  async toggle(id: number): Promise<Rutina> {
    const response = await axios.patch(`/rutinas/${id}/toggle`)
    return response.data.data
  },
}
