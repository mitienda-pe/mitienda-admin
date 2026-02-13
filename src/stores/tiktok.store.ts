import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tiktokApi } from '@/api/tiktok.api'
import type { StoreTiktokSettings, StoreTiktokUpdate } from '@/types/tiktok.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_SETTINGS: StoreTiktokSettings = {
  tienda_tiktok_pixel_id: null,
  tienda_tiktok_access_token: null,
  has_access_token: false,
  store_url: ''
}

export const useTiktokStore = defineStore('tiktok', () => {
  const savedSettings = ref<StoreTiktokSettings>(deepClone(DEFAULT_SETTINGS))
  const draftSettings = ref<StoreTiktokSettings>(deepClone(DEFAULT_SETTINGS))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const hasChanges = computed(() => {
    const editableKeys: (keyof StoreTiktokUpdate)[] = [
      'tienda_tiktok_pixel_id',
      'tienda_tiktok_access_token'
    ]
    return editableKeys.some(
      key => (draftSettings.value[key] ?? '') !== (savedSettings.value[key] ?? '')
    )
  })

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const response = await tiktokApi.getSettings()
      if (response.success && response.data) {
        savedSettings.value = response.data
        draftSettings.value = deepClone(response.data)
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar la configuración'
    } finally {
      isLoading.value = false
    }
  }

  async function saveSettings(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const update: StoreTiktokUpdate = {
        tienda_tiktok_pixel_id: draftSettings.value.tienda_tiktok_pixel_id,
        tienda_tiktok_access_token: draftSettings.value.tienda_tiktok_access_token
      }
      const response = await tiktokApi.updateSettings(update)
      if (response.success && response.data) {
        savedSettings.value = response.data
        draftSettings.value = deepClone(response.data)
      } else {
        savedSettings.value = deepClone(draftSettings.value)
      }
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al guardar la configuración'
      return false
    } finally {
      isSaving.value = false
    }
  }

  function updateField<K extends keyof StoreTiktokSettings>(
    field: K,
    value: StoreTiktokSettings[K]
  ) {
    ;(draftSettings.value as Record<string, unknown>)[field] = value
  }

  return {
    savedSettings,
    draftSettings,
    isLoading,
    isSaving,
    error,
    hasChanges,
    fetchSettings,
    saveSettings,
    updateField
  }
})
