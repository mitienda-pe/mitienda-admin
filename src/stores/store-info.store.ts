import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storeApi } from '@/api/store.api'
import type {
  StoreInfo,
  StoreInfoUpdateRequest,
  StoreAddress,
  StoreAddressCreateRequest,
  StoreAddressUpdateRequest,
  Rubro
} from '@/types/store.types'

export const useStoreInfoStore = defineStore('storeInfo', () => {
  // State
  const info = ref<StoreInfo | null>(null)
  const addresses = ref<StoreAddress[]>([])
  const rubros = ref<Rubro[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // ─── Store Info Actions ───

  async function fetchInfo() {
    try {
      isLoading.value = true
      error.value = null

      const response = await storeApi.getInfo()

      if (response.success && response.data) {
        info.value = response.data
      }
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar información de la tienda'
      console.error('Error al cargar información de la tienda:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function saveInfo(data: StoreInfoUpdateRequest) {
    try {
      isSaving.value = true
      error.value = null

      const response = await storeApi.updateInfo(data)

      if (response.success && response.data) {
        info.value = response.data
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar información'
      console.error('Error al guardar información:', err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function fetchRubros() {
    try {
      const response = await storeApi.getRubros()

      if (response.success && response.data) {
        rubros.value = response.data
      }
    } catch (err: any) {
      console.error('Error al cargar rubros:', err)
    }
  }

  // ─── Store Addresses Actions ───

  async function fetchAddresses() {
    try {
      isLoading.value = true
      error.value = null

      const response = await storeApi.getAddresses()

      if (response.success && response.data) {
        addresses.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar direcciones'
      console.error('Error al cargar direcciones:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAddress(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await storeApi.getAddress(id)

      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar dirección'
      console.error('Error al cargar dirección:', err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createAddress(data: StoreAddressCreateRequest) {
    try {
      isSaving.value = true
      error.value = null

      const response = await storeApi.createAddress(data)

      if (response.success && response.data) {
        await fetchAddresses()
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear dirección'
      console.error('Error al crear dirección:', err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateAddress(id: number, data: StoreAddressUpdateRequest) {
    try {
      isSaving.value = true
      error.value = null

      const response = await storeApi.updateAddress(id, data)

      if (response.success && response.data) {
        await fetchAddresses()
        return response.data
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar dirección'
      console.error('Error al actualizar dirección:', err)
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteAddress(id: number) {
    try {
      isLoading.value = true
      error.value = null

      await storeApi.deleteAddress(id)
      await fetchAddresses()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar dirección'
      console.error('Error al eliminar dirección:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    info,
    addresses,
    rubros,
    isLoading,
    isSaving,
    error,
    // Actions
    fetchInfo,
    saveInfo,
    fetchRubros,
    fetchAddresses,
    fetchAddress,
    createAddress,
    updateAddress,
    deleteAddress
  }
})
