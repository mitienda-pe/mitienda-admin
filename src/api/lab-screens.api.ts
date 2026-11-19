import axios from './axios'

/**
 * Pantallas de laboratorio (plugin `lab-screen`): el panel genera el código con
 * el que el laboratorio vincula su pantalla en lab.mitienda.pe, y la desconecta.
 */
export interface LabScreen {
  id: number
  nombre: string
  vinculada: boolean
  vinculada_at: string | null
  codigo_vence: string | null
  ultimo_uso: string | null
  push: boolean
  /** Solo al crearla: el código en claro ("ABCD-2345"). */
  code?: string
}

export const LAB_SCREEN_URL = 'https://lab.mitienda.pe'

export const labScreensApi = {
  async list(): Promise<LabScreen[]> {
    const response = await axios.get('/lab-screens')
    return response.data.data
  },

  async create(nombre: string): Promise<LabScreen> {
    const response = await axios.post('/lab-screens', { nombre })
    return response.data.data
  },

  async remove(id: number): Promise<void> {
    await axios.delete(`/lab-screens/${id}`)
  },
}
