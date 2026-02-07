import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { menuApi } from '@/api/menu.api'
import type {
  Menu,
  MenuItemForm,
  MenuLinkType,
  LinkOption,
  LinkOptionGroup
} from '@/types/menu.types'

export const useMenuStore = defineStore('menu', () => {
  // State
  const menu = ref<Menu | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const linkOptionsCache = ref<Partial<Record<MenuLinkType, LinkOption[] | LinkOptionGroup[]>>>({})
  const isLoadingOptions = ref(false)

  // Getters
  const hasMenu = computed(() => menu.value !== null)
  const menuItems = computed(() => menu.value?.items ?? [])

  /** Flat list of items that can be parents (level 0 and 1 only) */
  const availableParents = computed(() => {
    const parents: { id: number; label: string; level: number }[] = []
    for (const item of menuItems.value) {
      parents.push({ id: item.id, label: item.label, level: 0 })
      if (item.children) {
        for (const child of item.children) {
          parents.push({ id: child.id, label: `  └ ${child.label}`, level: 1 })
        }
      }
    }
    return parents
  })

  // Actions
  async function fetchMenu() {
    isLoading.value = true
    error.value = null
    try {
      const response = await menuApi.getMenu()
      if (response.success) {
        menu.value = response.data ?? null
      }
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error ?? err.message ?? 'Error al cargar el menú'
    } finally {
      isLoading.value = false
    }
  }

  async function createMenu() {
    isSaving.value = true
    error.value = null
    try {
      const response = await menuApi.createMenu()
      if (response.success && response.data) {
        menu.value = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error ?? 'Error al crear el menú'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteMenu() {
    isSaving.value = true
    error.value = null
    try {
      await menuApi.deleteMenu()
      menu.value = null
      linkOptionsCache.value = {}
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error ?? 'Error al eliminar el menú'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function addItem(form: MenuItemForm) {
    isSaving.value = true
    error.value = null
    try {
      await menuApi.addItem(form)
      await fetchMenu()
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error ?? 'Error al agregar el enlace'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateItem(id: number, data: Partial<MenuItemForm>) {
    isSaving.value = true
    error.value = null
    try {
      await menuApi.updateItem(id, data)
      await fetchMenu()
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error ?? 'Error al actualizar el enlace'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteItem(id: number) {
    isSaving.value = true
    error.value = null
    try {
      await menuApi.deleteItem(id)
      await fetchMenu()
    } catch (err: any) {
      const msg = err.response?.data?.messages?.error ?? 'Error al eliminar el enlace'
      error.value = msg
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function reorderItems(items: { id: number; parentId: number; order: number }[]) {
    isSaving.value = true
    error.value = null
    try {
      await menuApi.reorder(items)
      await fetchMenu()
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error ?? 'Error al reordenar'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function fetchLinkOptions(type: MenuLinkType) {
    // Return cached if available
    if (linkOptionsCache.value[type]) {
      return linkOptionsCache.value[type]!
    }

    isLoadingOptions.value = true
    try {
      const response = await menuApi.getLinkOptions(type)
      if (response.success && response.data) {
        linkOptionsCache.value[type] = response.data
        return response.data
      }
      return []
    } catch {
      return []
    } finally {
      isLoadingOptions.value = false
    }
  }

  function clearLinkOptionsCache() {
    linkOptionsCache.value = {}
  }

  return {
    // State
    menu,
    isLoading,
    isSaving,
    error,
    isLoadingOptions,
    // Getters
    hasMenu,
    menuItems,
    availableParents,
    // Actions
    fetchMenu,
    createMenu,
    deleteMenu,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    fetchLinkOptions,
    clearLinkOptionsCache
  }
})
