import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dopplerApi } from '@/api/doppler.api'
import type { StoreDopplerSettings, StoreDopplerUpdate } from '@/types/doppler.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_SETTINGS: StoreDopplerSettings = {
  tienda_doppler_script_url: null,
  tienda_doppler_script_ref: null,
  is_installed: false
}

export const useDopplerStore = defineStore('doppler', () => {
  const savedSettings = ref<StoreDopplerSettings>(deepClone(DEFAULT_SETTINGS))
  const draftSettings = ref<StoreDopplerSettings>(deepClone(DEFAULT_SETTINGS))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const hasChanges = computed(() => {
    const editableKeys: (keyof StoreDopplerUpdate)[] = [
      'tienda_doppler_script_url',
      'tienda_doppler_script_ref'
    ]
    return editableKeys.some(
      key => (draftSettings.value[key] ?? '') !== (savedSettings.value[key] ?? '')
    )
  })

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const response = await dopplerApi.getSettings()
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
      const update: StoreDopplerUpdate = {
        tienda_doppler_script_url: draftSettings.value.tienda_doppler_script_url,
        tienda_doppler_script_ref: draftSettings.value.tienda_doppler_script_ref
      }
      const response = await dopplerApi.updateSettings(update)
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

  function updateField<K extends keyof StoreDopplerSettings>(
    field: K,
    value: StoreDopplerSettings[K]
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
