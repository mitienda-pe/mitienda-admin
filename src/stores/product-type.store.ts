import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productTypeApi } from '@/api/product-type.api'
import type { ProductType } from '@/types/product.types'

// `productostipos` es una tabla maestra global (no multitenant). La cacheamos
// una sola vez por sesión y la reusan los formularios y filtros de productos.
export const useProductTypeStore = defineStore('productTypes', () => {
  const types = ref<ProductType[]>([])
  const isLoading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  // Solo tipos públicos para los selectores (excluye digital, publico=0).
  const publicTypes = computed(() => types.value.filter((t) => t.publico))

  async function fetchTypes(force = false) {
    if (loaded.value && !force) return
    try {
      isLoading.value = true
      error.value = null
      const res = await productTypeApi.getAll()
      if (res.success && res.data) {
        types.value = res.data
        loaded.value = true
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar tipos de producto'
      console.error('Error al cargar tipos de producto:', err)
    } finally {
      isLoading.value = false
    }
  }

  function getById(id?: number | null): ProductType | null {
    if (!id) return null
    return types.value.find((t) => t.id === id) ?? null
  }

  return { types, publicTypes, isLoading, loaded, error, fetchTypes, getById }
})
