import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productsApi, type ProductsFilters } from '@/api/products.api'
import type { Product, ProductFilters } from '@/types/product.types'

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  })

  const filters = ref<ProductFilters>({
    search: '',
    categoryId: null,
    brandId: null,
    published: null,
    stockStatus: 'all'
  })

  // Getters
  const hasProducts = computed(() => products.value.length > 0)

  // Actions
  async function fetchProducts(loadMore: boolean = false) {
    try {
      isLoading.value = true
      error.value = null

      if (!loadMore) {
        pagination.value.page = 1
        products.value = []
      }

      const apiFilters: ProductsFilters = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: filters.value.search || undefined,
        category_id: filters.value.categoryId || undefined,
        brand_id: filters.value.brandId || undefined,
        published: filters.value.published,
        stock_status: filters.value.stockStatus
      }

      const response = await productsApi.getProducts(apiFilters)

      if (response.success && response.data) {
        if (loadMore) {
          products.value = [...products.value, ...response.data]
        } else {
          products.value = response.data
        }

        if (response.meta) {
          pagination.value = {
            ...pagination.value,
            total: response.meta.total,
            hasMore: response.meta.hasMore
          }
        }
      } else {
        error.value = 'Error al cargar productos'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      console.error('Error al cargar productos:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProduct(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await productsApi.getProduct(id)

      if (response.success && response.data) {
        currentProduct.value = response.data
      } else {
        error.value = 'Producto no encontrado'
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar producto'
      console.error('Error al cargar producto:', err)
    } finally {
      isLoading.value = false
    }
  }

  function setSearch(search: string) {
    filters.value.search = search
    fetchProducts()
  }

  function setFilters(newFilters: Partial<ProductFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    fetchProducts()
  }

  function loadMore() {
    if (pagination.value.hasMore && !isLoading.value) {
      pagination.value.page++
      fetchProducts(true)
    }
  }

  function resetFilters() {
    filters.value = {
      search: '',
      categoryId: null,
      brandId: null,
      published: null,
      stockStatus: 'all'
    }
    fetchProducts()
  }

  async function updateProduct(id: number, data: { price?: number; stock?: number; published?: boolean; order?: number; description_html?: string }) {
    try {
      isLoading.value = true
      error.value = null

      const response = await productsApi.updateProduct(id, data)

      if (response.success && response.data) {
        // Actualizar el producto actual si es el que se está viendo
        if (currentProduct.value?.id === id) {
          currentProduct.value = response.data
        }

        // Actualizar en la lista de productos si existe
        const index = products.value.findIndex(p => p.id === id)
        if (index !== -1) {
          products.value[index] = response.data
        }

        return { success: true, data: response.data }
      } else {
        error.value = 'Error al actualizar producto'
        return { success: false, data: null }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar producto'
      console.error('Error al actualizar producto:', err)
      return { success: false, data: null }
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    products,
    currentProduct,
    isLoading,
    error,
    pagination,
    filters,
    // Getters
    hasProducts,
    // Actions
    fetchProducts,
    fetchProduct,
    setSearch,
    setFilters,
    loadMore,
    resetFilters,
    updateProduct
  }
})
