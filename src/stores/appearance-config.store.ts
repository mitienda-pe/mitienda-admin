import { defineStore } from 'pinia'
import { ref } from 'vue'
import appearanceApi from '@/api/appearance.api'

export const useAppearanceConfigStore = defineStore('appearance-config', () => {
  const logoUrl = ref<string | null>(null)
  const faviconUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const isUploadingLogo = ref(false)
  const isUploadingFavicon = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  async function fetchConfig() {
    isLoading.value = true
    error.value = null
    try {
      const response = await appearanceApi.getConfig()
      if (response.success && response.data) {
        logoUrl.value = response.data.logo_url
        faviconUrl.value = response.data.favicon_url
      }
      isLoaded.value = true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar la configuración'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function uploadLogo(file: File): Promise<boolean> {
    isUploadingLogo.value = true
    error.value = null
    try {
      const response = await appearanceApi.uploadLogo(file)
      if (response.success && response.data) {
        logoUrl.value = response.data.logo_url
        faviconUrl.value = response.data.favicon_url
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al subir el logotipo'
      error.value = message
      return false
    } finally {
      isUploadingLogo.value = false
    }
  }

  async function uploadFavicon(file: File): Promise<boolean> {
    isUploadingFavicon.value = true
    error.value = null
    try {
      const response = await appearanceApi.uploadFavicon(file)
      if (response.success && response.data) {
        logoUrl.value = response.data.logo_url
        faviconUrl.value = response.data.favicon_url
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al subir el favicon'
      error.value = message
      return false
    } finally {
      isUploadingFavicon.value = false
    }
  }

  async function deleteLogo(): Promise<boolean> {
    error.value = null
    try {
      const response = await appearanceApi.deleteLogo()
      if (response.success && response.data) {
        logoUrl.value = response.data.logo_url
        faviconUrl.value = response.data.favicon_url
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al eliminar el logotipo'
      error.value = message
      return false
    }
  }

  async function deleteFavicon(): Promise<boolean> {
    error.value = null
    try {
      const response = await appearanceApi.deleteFavicon()
      if (response.success && response.data) {
        logoUrl.value = response.data.logo_url
        faviconUrl.value = response.data.favicon_url
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al eliminar el favicon'
      error.value = message
      return false
    }
  }

  return {
    logoUrl,
    faviconUrl,
    isLoading,
    isUploadingLogo,
    isUploadingFavicon,
    error,
    isLoaded,
    fetchConfig,
    uploadLogo,
    uploadFavicon,
    deleteLogo,
    deleteFavicon,
  }
})
