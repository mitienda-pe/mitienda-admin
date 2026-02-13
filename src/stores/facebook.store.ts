import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { facebookApi } from '@/api/facebook.api'
import type { StoreFacebookSettings, StoreFacebookUpdate } from '@/types/facebook.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_SETTINGS: StoreFacebookSettings = {
  tienda_identificadorpixel: null,
  tienda_fb_capi_token: null,
  has_capi_token: false,
  tienda_fb_test_event_code: null,
  tienda_swintegracionfb: 0,
  store_url: '',
  feed_csv_url: '',
  feed_xml_url: ''
}

export const useFacebookStore = defineStore('facebook', () => {
  const savedSettings = ref<StoreFacebookSettings>(deepClone(DEFAULT_SETTINGS))
  const draftSettings = ref<StoreFacebookSettings>(deepClone(DEFAULT_SETTINGS))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const hasChanges = computed(() => {
    const editableKeys: (keyof StoreFacebookUpdate)[] = [
      'tienda_identificadorpixel',
      'tienda_fb_capi_token',
      'tienda_fb_test_event_code'
    ]
    return editableKeys.some(
      key => (draftSettings.value[key] ?? '') !== (savedSettings.value[key] ?? '')
    )
  })

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const response = await facebookApi.getSettings()
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
      const update: StoreFacebookUpdate = {
        tienda_identificadorpixel: draftSettings.value.tienda_identificadorpixel,
        tienda_fb_capi_token: draftSettings.value.tienda_fb_capi_token,
        tienda_fb_test_event_code: draftSettings.value.tienda_fb_test_event_code
      }
      const response = await facebookApi.updateSettings(update)
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

  function updateField<K extends keyof StoreFacebookSettings>(
    field: K,
    value: StoreFacebookSettings[K]
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
