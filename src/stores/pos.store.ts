import { ref } from 'vue'
import { defineStore } from 'pinia'
import { posApi } from '@/api/pos.api'
import { useAuthStore } from '@/stores/auth.store'
import type {
  PosCajero,
  PosCajeroCreatePayload,
  PosCajeroUpdatePayload,
  PosSucursal,
  PosSucursalesNetsuiteConfigResponse,
  PosSucursalNetsuiteUpdate,
  CheckPinResult
} from '@/types/pos.types'

export const usePosStore = defineStore('pos', () => {
  const cajeros = ref<PosCajero[]>([])
  const currentCajero = ref<PosCajero | null>(null)
  const sucursales = ref<PosSucursal[]>([])
  const netsuiteConfig = ref<PosSucursalesNetsuiteConfigResponse | null>(null)

  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  function requireTiendaId(): number {
    const authStore = useAuthStore()
    const id = authStore.selectedStore?.id
    if (!id) {
      throw new Error('No hay tienda seleccionada')
    }
    return id
  }

  async function fetchCajeros() {
    isLoading.value = true
    error.value = null
    try {
      const tiendaId = requireTiendaId()
      const response = await posApi.listCajeros(tiendaId)
      if (response.success && response.data) {
        cajeros.value = response.data
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar cajeros'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCajero(id: number) {
    isDetailLoading.value = true
    error.value = null
    try {
      const response = await posApi.getCajero(id)
      if (response.success && response.data) {
        currentCajero.value = response.data
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar el cajero'
    } finally {
      isDetailLoading.value = false
    }
  }

  async function createCajero(
    payload: Omit<PosCajeroCreatePayload, 'tienda_id'>
  ): Promise<PosCajero | null> {
    isSaving.value = true
    error.value = null
    try {
      const tiendaId = requireTiendaId()
      const response = await posApi.createCajero({ ...payload, tienda_id: tiendaId })
      if (response.success && response.data) {
        await fetchCajeros()
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al crear cajero'
      throw e
    } finally {
      isSaving.value = false
    }
  }

  async function updateCajero(id: number, payload: PosCajeroUpdatePayload): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const response = await posApi.updateCajero(id, payload)
      if (response.success) {
        await fetchCajeros()
      }
      return response.success
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al actualizar cajero'
      throw e
    } finally {
      isSaving.value = false
    }
  }

  async function deleteCajero(id: number): Promise<boolean> {
    try {
      const response = await posApi.deleteCajero(id)
      if (response.success) {
        await fetchCajeros()
      }
      return response.success
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al desactivar cajero'
      return false
    }
  }

  async function checkPin(
    pin: string,
    excludeEmpleadoId: number | null = null
  ): Promise<CheckPinResult | null> {
    try {
      const tiendaId = requireTiendaId()
      const response = await posApi.checkPin(tiendaId, pin, excludeEmpleadoId)
      return response.data ?? null
    } catch {
      return null
    }
  }

  async function asignarSucursal(empleadoId: number, sucursalId: number) {
    return posApi.asignarSucursal(empleadoId, sucursalId)
  }

  async function desasignarSucursal(empleadoId: number, sucursalId: number) {
    return posApi.desasignarSucursal(empleadoId, sucursalId)
  }

  async function fetchSucursales() {
    isLoading.value = true
    error.value = null
    try {
      const tiendaId = requireTiendaId()
      const response = await posApi.listSucursales(tiendaId)
      if (response.success && response.data) {
        sucursales.value = response.data
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar sucursales'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchNetsuiteConfig() {
    try {
      const tiendaId = requireTiendaId()
      const response = await posApi.getSucursalesNetsuiteConfig(tiendaId)
      if (response.success && response.data) {
        netsuiteConfig.value = response.data
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al cargar configuración NetSuite'
    }
  }

  async function updateNetsuiteMapping(
    branchId: number,
    payload: PosSucursalNetsuiteUpdate
  ): Promise<boolean> {
    try {
      const tiendaId = requireTiendaId()
      const response = await posApi.updateSucursalNetsuiteConfig(tiendaId, branchId, payload)
      if (response.success) {
        await fetchNetsuiteConfig()
      }
      return response.success
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al actualizar mapeo NetSuite'
      return false
    }
  }

  return {
    cajeros,
    currentCajero,
    sucursales,
    netsuiteConfig,
    isLoading,
    isDetailLoading,
    isSaving,
    error,
    fetchCajeros,
    fetchCajero,
    createCajero,
    updateCajero,
    deleteCajero,
    checkPin,
    asignarSucursal,
    desasignarSucursal,
    fetchSucursales,
    fetchNetsuiteConfig,
    updateNetsuiteMapping
  }
})
