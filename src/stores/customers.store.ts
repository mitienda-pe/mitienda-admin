import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { customersApi, type CustomersFilters } from '@/api/customers.api'
import type {
  Customer,
  CustomerDetail,
  CustomerFilters,
  CustomerStats,
  CustomerFormData,
  CustomerAddressFormData,
  DocumentLookupResult
} from '@/types/customer.types'

export const useCustomersStore = defineStore('customers', () => {
  // State
  const customers = ref<Customer[]>([])
  const currentCustomer = ref<CustomerDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<CustomerStats | null>(null)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  })

  const sorting = ref({
    field: 'last_order_date',
    order: 'desc' as 'asc' | 'desc'
  })

  // Filter for customers with orders (default: true = only show customers with purchases)
  const hasOrders = ref<boolean | null>(true)

  const filters = ref<CustomerFilters>({
    search: '',
    verified: null,
    blocked: null,
    dateFrom: null,
    dateTo: null
  })

  // Getters
  const hasCustomers = computed(() => customers.value.length > 0)

  const customersCount = computed(() => customers.value.length)

  const filteredCustomers = computed(() => {
    let filtered = customers.value

    // El filtrado real se hace en el backend, pero podemos tener filtros locales adicionales
    return filtered
  })

  // Actions
  async function fetchCustomers(loadMore: boolean = false) {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const apiFilters: CustomersFilters = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: filters.value.search || undefined,
        verified: filters.value.verified !== null ? filters.value.verified : undefined,
        blocked: filters.value.blocked !== null ? filters.value.blocked : undefined,
        date_from: filters.value.dateFrom || undefined,
        date_to: filters.value.dateTo || undefined,
        has_orders: hasOrders.value !== null ? hasOrders.value : undefined,
        sort: sorting.value.field,
        order: sorting.value.order
      }

      const response = await customersApi.getCustomers(apiFilters)

      if (response.success && response.data) {
        if (loadMore) {
          // Agregar a la lista existente (scroll infinito)
          customers.value = [...customers.value, ...response.data]
        } else {
          // Reemplazar la lista (nueva búsqueda/filtros)
          customers.value = response.data
        }

        // Actualizar paginación
        pagination.value.total = response.meta?.total || 0
        pagination.value.hasMore = customers.value.length < (response.meta?.total || 0)
      } else {
        throw new Error('Error al cargar clientes')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching customers:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCustomer(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await customersApi.getCustomer(id)

      if (response.success && response.data) {
        currentCustomer.value = response.data
      } else {
        throw new Error(response.message || 'Error al cargar cliente')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching customer:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await customersApi.getStats()

      if (response.success && response.data) {
        stats.value = response.data
      }
    } catch (err) {
      console.error('Error fetching customer stats:', err)
    }
  }

  async function createCustomer(formData: CustomerFormData) {
    try {
      isLoading.value = true
      error.value = null

      const response = await customersApi.createCustomer(formData)

      if (response.success && response.data) {
        // Recargar lista
        pagination.value.page = 1
        await fetchCustomers()
        return response.data
      } else {
        throw new Error(response.message || 'Error al crear cliente')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error creating customer:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateCustomer(id: number, formData: Partial<CustomerFormData>) {
    try {
      isLoading.value = true
      error.value = null

      const response = await customersApi.updateCustomer(id, formData)

      if (response.success && response.data) {
        // Actualizar en la lista
        const index = customers.value.findIndex(c => c.id === id)
        if (index !== -1) {
          customers.value[index] = response.data
        }

        // Actualizar cliente actual si es el mismo
        if (currentCustomer.value?.id === id) {
          currentCustomer.value = { ...currentCustomer.value, ...response.data }
        }

        return response.data
      } else {
        throw new Error(response.message || 'Error al actualizar cliente')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error updating customer:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function toggleBlockCustomer(id: number, blocked: boolean) {
    try {
      isLoading.value = true
      error.value = null

      const response = await customersApi.toggleBlockCustomer(id, blocked)

      if (response.success && response.data) {
        // Actualizar en la lista
        const index = customers.value.findIndex(c => c.id === id)
        if (index !== -1) {
          customers.value[index].blocked = blocked
        }

        // Actualizar cliente actual si es el mismo
        if (currentCustomer.value?.id === id) {
          currentCustomer.value.blocked = blocked
        }

        return response.data
      } else {
        throw new Error(response.message || 'Error al actualizar estado de cliente')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error toggling customer block:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ==========================================
  // Document Lookup
  // ==========================================

  async function lookupDocument(
    documentNumber: string,
    type: 'dni' | 'ruc'
  ): Promise<DocumentLookupResult | null> {
    try {
      const response = await customersApi.lookupDocument(documentNumber, type)
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (err) {
      console.error('Error looking up document:', err)
      return null
    }
  }

  // ==========================================
  // Address Management
  // ==========================================

  async function addAddress(customerId: number, data: CustomerAddressFormData) {
    try {
      const response = await customersApi.createCustomerAddress(customerId, data)
      if (response.success && response.data) {
        // Recargar cliente para obtener direcciones actualizadas
        await fetchCustomer(customerId)
        return response.data
      }
      throw new Error(response.message || 'Error al crear dirección')
    } catch (err) {
      console.error('Error adding address:', err)
      throw err
    }
  }

  async function updateAddress(
    customerId: number,
    addressId: number,
    data: Partial<CustomerAddressFormData>
  ) {
    try {
      const response = await customersApi.updateCustomerAddress(customerId, addressId, data)
      if (response.success && response.data) {
        await fetchCustomer(customerId)
        return response.data
      }
      throw new Error(response.message || 'Error al actualizar dirección')
    } catch (err) {
      console.error('Error updating address:', err)
      throw err
    }
  }

  async function deleteAddress(customerId: number, addressId: number) {
    try {
      const response = await customersApi.deleteCustomerAddress(customerId, addressId)
      if (response.success) {
        await fetchCustomer(customerId)
        return true
      }
      throw new Error(response.message || 'Error al eliminar dirección')
    } catch (err) {
      console.error('Error deleting address:', err)
      throw err
    }
  }

  async function setDefaultAddress(customerId: number, addressId: number) {
    try {
      const response = await customersApi.setDefaultAddress(customerId, addressId)
      if (response.success && response.data) {
        await fetchCustomer(customerId)
        return response.data
      }
      throw new Error(response.message || 'Error al establecer dirección predeterminada')
    } catch (err) {
      console.error('Error setting default address:', err)
      throw err
    }
  }

  // ==========================================
  // Filter Actions
  // ==========================================

  function setFilters(newFilters: Partial<CustomerFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
    fetchCustomers()
  }

  function setSearch(query: string) {
    filters.value.search = query
    pagination.value.page = 1
    fetchCustomers()
  }

  function setVerified(verified: boolean | null) {
    filters.value.verified = verified
    pagination.value.page = 1
    fetchCustomers()
  }

  function setBlocked(blocked: boolean | null) {
    filters.value.blocked = blocked
    pagination.value.page = 1
    fetchCustomers()
  }

  function setDateRange(dateFrom: string | null, dateTo: string | null) {
    filters.value.dateFrom = dateFrom
    filters.value.dateTo = dateTo
    pagination.value.page = 1
    fetchCustomers()
  }

  function resetFilters() {
    filters.value = {
      search: '',
      verified: null,
      blocked: null,
      dateFrom: null,
      dateTo: null
    }
    hasOrders.value = true // Reset to default: only customers with orders
    pagination.value.page = 1
    fetchCustomers()
  }

  function setHasOrders(value: boolean | null) {
    hasOrders.value = value
    pagination.value.page = 1
    fetchCustomers()
  }

  function setSort(field: string, order: 'asc' | 'desc') {
    sorting.value.field = field
    sorting.value.order = order
    pagination.value.page = 1
    fetchCustomers()
  }

  function loadMore() {
    if (pagination.value.hasMore && !isLoading.value) {
      pagination.value.page++
      fetchCustomers(true)
    }
  }

  function clearCurrentCustomer() {
    currentCustomer.value = null
  }

  return {
    // State
    customers,
    currentCustomer,
    isLoading,
    error,
    pagination,
    filters,
    sorting,
    hasOrders,
    stats,

    // Getters
    hasCustomers,
    customersCount,
    filteredCustomers,

    // Actions
    fetchCustomers,
    fetchCustomer,
    fetchStats,
    createCustomer,
    updateCustomer,
    toggleBlockCustomer,
    lookupDocument,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    setFilters,
    setSearch,
    setVerified,
    setBlocked,
    setDateRange,
    setHasOrders,
    resetFilters,
    setSort,
    loadMore,
    clearCurrentCustomer
  }
})
