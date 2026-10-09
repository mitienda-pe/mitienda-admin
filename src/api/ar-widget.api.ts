import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  ArWidget,
  ArWidgetFormData,
  ArWidgetImageOption,
  ArWidgetProductOption
} from '@/types/ar-widget.types'

/**
 * Guardar un widget puede costarle al comerciante otro modelo 3D de su plan: el
 * proveedor reconstruye cuando cambian las fotos, las medidas o la categoría. La
 * API responde 409 con `will_rebuild` y NO guarda hasta que se reintente con
 * `confirm_rebuild`, así nadie gasta un modelo sin querer.
 */
export interface ArWidgetSaveResult {
  widget?: ArWidget
  /** true = la API pide confirmar porque el cambio reconstruye el modelo. */
  needsRebuildConfirm: boolean
  message?: string
}

export const arWidgetApi = {
  async getAll(): Promise<ApiResponse<ArWidget[]>> {
    const response = await apiClient.get('/ar-widgets')
    return { success: true, data: (response.data?.data ?? []) as ArWidget[] }
  },

  async getById(id: number): Promise<ApiResponse<ArWidget & { available_images: ArWidgetImageOption[] }>> {
    const response = await apiClient.get(`/ar-widgets/${id}`)
    return { success: true, data: response.data?.data }
  },

  /** Productos sin visor y con al menos una foto, para el alta. */
  async searchProducts(q: string): Promise<ArWidgetProductOption[]> {
    const response = await apiClient.get('/ar-widgets/products', { params: q ? { q } : {} })
    return (response.data?.data ?? []) as ArWidgetProductOption[]
  },

  /** Galería de un producto para el selector de fotos. */
  async productImages(productoId: number): Promise<ArWidgetImageOption[]> {
    const response = await apiClient.get(`/ar-widgets/product-images/${productoId}`)
    return (response.data?.data ?? []) as ArWidgetImageOption[]
  },

  async create(data: ArWidgetFormData): Promise<ArWidgetSaveResult> {
    const response = await apiClient.post('/ar-widgets', data)
    return { widget: response.data?.data as ArWidget, needsRebuildConfirm: false }
  },

  async update(id: number, data: ArWidgetFormData, confirmRebuild = false): Promise<ArWidgetSaveResult> {
    try {
      const response = await apiClient.put(`/ar-widgets/${id}`, {
        ...data,
        confirm_rebuild: confirmRebuild
      })
      return { widget: response.data?.data as ArWidget, needsRebuildConfirm: false }
    } catch (error: any) {
      // El 409 no es un fallo: es la API pidiendo confirmación.
      if (error?.response?.status === 409 && error.response.data?.will_rebuild) {
        return { needsRebuildConfirm: true, message: error.response.data?.message }
      }
      throw error
    }
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/ar-widgets/${id}`)
  }
}
