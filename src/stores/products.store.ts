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
    published: true,
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
      console.log('🔍 Store - API Response:', response)

      if (response.success && response.data) {
        console.log('🔍 Store - Response success, data length:', response.data.length)
        // Filtrar productos en el frontend según stock_status para manejar unlimited_stock correctamente
        let filteredProducts = response.data

        // Si se filtra por "agotados", excluir productos con stock ilimitado
        if (filters.value.stockStatus === 'out_of_stock') {
          filteredProducts = response.data.filter(product => !product.unlimited_stock)
        }
        // Si se filtra por "en stock", incluir productos con stock ilimitado
        else if (filters.value.stockStatus === 'in_stock') {
          filteredProducts = response.data.filter(product =>
            product.unlimited_stock || product.stock > 0
          )
        }
        // Si se filtra por "stock limitado", excluir productos con stock ilimitado
        else if (filters.value.stockStatus === 'limited') {
          filteredProducts = response.data.filter(product => !product.unlimited_stock)
        }

        if (loadMore) {
          products.value = [...products.value, ...filteredProducts]
        } else {
          products.value = filteredProducts
        }
        console.log('🔍 Store - Filtered products length:', filteredProducts.length)
        console.log('🔍 Store - Products value length:', products.value.length)

        if (response.meta) {
          pagination.value = {
            page: response.meta.page || pagination.value.page,
            limit: response.meta.limit || response.meta.perPage || pagination.value.limit,
            total: response.meta.total || 0,
            hasMore: response.meta.hasMore || false
          }
          console.log('🔍 Store - Pagination:', pagination.value)
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
      published: true,
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
