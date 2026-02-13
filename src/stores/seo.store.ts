import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { seoApi } from '@/api/seo.api'
import type { StoreSeoSettings, StoreSeoUpdate } from '@/types/seo.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_SETTINGS: StoreSeoSettings = {
  tienda_codigo_google_analytics: null,
  tienda_google_tagmanager: null,
  tienda_tag_google_site_verification: null,
  tienda_metadata_titulo: null,
  tienda_slogan: null,
  tienda_meta_img_url: null,
  store_url: '',
  sitemap_url: '',
  product_feed_url: ''
}

export const useSeoStore = defineStore('seo', () => {
  const savedSettings = ref<StoreSeoSettings>(deepClone(DEFAULT_SETTINGS))
  const draftSettings = ref<StoreSeoSettings>(deepClone(DEFAULT_SETTINGS))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isUploadingOgImage = ref(false)
  const error = ref<string | null>(null)

  const hasChanges = computed(() => {
    const editableKeys: (keyof StoreSeoUpdate)[] = [
      'tienda_codigo_google_analytics',
      'tienda_google_tagmanager',
      'tienda_tag_google_site_verification',
      'tienda_metadata_titulo',
      'tienda_slogan'
    ]
    return editableKeys.some(
      key => (draftSettings.value[key] ?? '') !== (savedSettings.value[key] ?? '')
    )
  })

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const response = await seoApi.getSettings()
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
      const update: StoreSeoUpdate = {
        tienda_codigo_google_analytics: draftSettings.value.tienda_codigo_google_analytics,
        tienda_google_tagmanager: draftSettings.value.tienda_google_tagmanager,
        tienda_tag_google_site_verification: draftSettings.value.tienda_tag_google_site_verification,
        tienda_metadata_titulo: draftSettings.value.tienda_metadata_titulo,
        tienda_slogan: draftSettings.value.tienda_slogan
      }
      const response = await seoApi.updateSettings(update)
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

  async function uploadOgImage(file: File): Promise<boolean> {
    isUploadingOgImage.value = true
    error.value = null
    try {
      const response = await seoApi.uploadOgImage(file)
      if (response.success && response.data) {
        savedSettings.value.tienda_meta_img_url = response.data.og_image_url
        draftSettings.value.tienda_meta_img_url = response.data.og_image_url
      }
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al subir la imagen'
      return false
    } finally {
      isUploadingOgImage.value = false
    }
  }

  async function deleteOgImage(): Promise<boolean> {
    error.value = null
    try {
      const response = await seoApi.deleteOgImage()
      if (response.success) {
        savedSettings.value.tienda_meta_img_url = null
        draftSettings.value.tienda_meta_img_url = null
      }
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al eliminar la imagen'
      return false
    }
  }

  function updateField<K extends keyof StoreSeoSettings>(field: K, value: StoreSeoSettings[K]) {
    ;(draftSettings.value as Record<string, unknown>)[field] = value
  }

  return {
    savedSettings,
    draftSettings,
    isLoading,
    isSaving,
    isUploadingOgImage,
    error,
    hasChanges,
    fetchSettings,
    saveSettings,
    uploadOgImage,
    deleteOgImage,
    updateField
  }
})
