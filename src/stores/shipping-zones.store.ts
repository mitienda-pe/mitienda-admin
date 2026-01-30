import { ref } from 'vue'
import { defineStore } from 'pinia'
import { shippingZonesApi } from '@/api/shipping-zones.api'
import type {
  ShippingZone,
  ShippingZoneDetail,
  CreateShippingZoneRequest,
  AddUbigeoRequest,
} from '@/types/shipping-zone.types'

export const useShippingZonesStore = defineStore('shipping-zones', () => {
  const zones = ref<ShippingZone[]>([])
  const currentZone = ref<ShippingZoneDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchZones() {
    try {
      isLoading.value = true
      error.value = null
      zones.value = await shippingZonesApi.getAll()
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar zonas de reparto'
      console.error('Failed to fetch shipping zones:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchZone(id: number) {
    try {
      isLoading.value = true
      error.value = null
      currentZone.value = await shippingZonesApi.getById(id)
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar zona'
      console.error('Failed to fetch shipping zone:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function createZone(payload: CreateShippingZoneRequest): Promise<number> {
    const result = await shippingZonesApi.create(payload)
    return result.id
  }

  async function updateZone(id: number, name: string) {
    await shippingZonesApi.update(id, name)
    // Update local state
    if (currentZone.value?.id === id) {
      currentZone.value.name = name
    }
    const idx = zones.value.findIndex((z) => z.id === id)
    if (idx !== -1) {
      zones.value[idx].name = name
    }
  }

  async function deleteZone(id: number) {
    await shippingZonesApi.remove(id)
    zones.value = zones.value.filter((z) => z.id !== id)
  }

  async function addUbigeo(zoneId: number, payload: AddUbigeoRequest) {
    await shippingZonesApi.addUbigeo(zoneId, payload)
    // Refresh zone detail
    if (currentZone.value?.id === zoneId) {
      await fetchZone(zoneId)
    }
  }

  async function removeUbigeo(zoneId: number, ubigeoId: number) {
    await shippingZonesApi.removeUbigeo(zoneId, ubigeoId)
    // Update local state
    if (currentZone.value?.id === zoneId) {
      currentZone.value.ubigeos = currentZone.value.ubigeos.filter(
        (u) => u.ubigeoId !== ubigeoId,
      )
      currentZone.value.ubigeoCount = currentZone.value.ubigeos.length
    }
  }

  return {
    zones,
    currentZone,
    isLoading,
    error,
    fetchZones,
    fetchZone,
    createZone,
    updateZone,
    deleteZone,
    addUbigeo,
    removeUbigeo,
  }
})
