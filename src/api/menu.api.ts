import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  Menu,
  MenuItem,
  MenuItemForm,
  MenuLinkType,
  LinkOption,
  LinkOptionGroup
} from '@/types/menu.types'

// Transforma un item del backend al formato del frontend
function transformItem(raw: any): MenuItem {
  return {
    id: parseInt(raw.menuenlace_id),
    label: raw.menuenlace_etiqueta,
    url: raw.menuenlace_url,
    type: raw.menuenlace_tipo,
    targetBlank: raw.menuenlace_swblank === 1 || raw.menuenlace_swblank === '1',
    order: parseInt(raw.menuenlace_orden),
    parentId: parseInt(raw.parent_id),
    children: raw.children ? raw.children.map(transformItem) : undefined
  }
}

function transformMenu(raw: any): Menu | null {
  if (!raw.menu) return null
  return {
    id: raw.menu.id,
    name: raw.menu.nombre,
    type: raw.menu.tipo,
    items: (raw.items || []).map(transformItem)
  }
}

export const menuApi = {
  async getMenu(): Promise<ApiResponse<Menu | null>> {
    const response = await apiClient.get('/menus')
    const data = response.data
    return { success: true, data: transformMenu(data) }
  },

  async createMenu(): Promise<ApiResponse<Menu>> {
    const response = await apiClient.post('/menus')
    const data = response.data
    return { success: true, data: transformMenu(data)! }
  },

  async deleteMenu(): Promise<ApiResponse<void>> {
    await apiClient.delete('/menus')
    return { success: true }
  },

  async addItem(form: MenuItemForm): Promise<ApiResponse<MenuItem>> {
    const response = await apiClient.post('/menus/items', {
      etiqueta: form.label,
      tipo: form.type,
      url: form.url,
      parent_id: form.parentId,
      target_blank: form.targetBlank ? 1 : 0
    })
    return { success: true, data: transformItem(response.data) }
  },

  async updateItem(id: number, data: Partial<MenuItemForm>): Promise<ApiResponse<MenuItem>> {
    const payload: Record<string, any> = {}
    if (data.label !== undefined) payload.etiqueta = data.label
    if (data.type !== undefined) payload.tipo = data.type
    if (data.url !== undefined) payload.url = data.url
    if (data.targetBlank !== undefined) payload.target_blank = data.targetBlank ? 1 : 0

    const response = await apiClient.put(`/menus/items/${id}`, payload)
    return { success: true, data: transformItem(response.data) }
  },

  async deleteItem(id: number): Promise<ApiResponse<void>> {
    await apiClient.delete(`/menus/items/${id}`)
    return { success: true }
  },

  async reorder(
    items: { id: number; parentId: number; order: number }[]
  ): Promise<ApiResponse<void>> {
    await apiClient.put('/menus/reorder', {
      items: items.map(i => ({
        id: i.id,
        parent_id: i.parentId,
        orden: i.order
      }))
    })
    return { success: true }
  },

  async getLinkOptions(type: MenuLinkType): Promise<ApiResponse<LinkOption[] | LinkOptionGroup[]>> {
    const response = await apiClient.get(`/menus/link-options/${type}`)
    return { success: true, data: response.data }
  }
}
