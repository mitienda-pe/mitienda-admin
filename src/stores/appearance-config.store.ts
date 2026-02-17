import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import appearanceApi from '@/api/appearance.api'
import type { CatalogPreferences } from '@/types/appearance.types'
import { DEFAULT_CATALOG_PREFERENCES } from '@/types/appearance.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export const useAppearanceConfigStore = defineStore('appearance-config', () => {
  // ── Branding state ──
  const logoUrl = ref<string | null>(null)
  const faviconUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const isUploadingLogo = ref(false)
  const isUploadingFavicon = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  // ── Catalog preferences state ──
  const savedCatalog = ref<CatalogPreferences>(deepClone(DEFAULT_CATALOG_PREFERENCES))
  const draftCatalog = ref<CatalogPreferences>(deepClone(DEFAULT_CATALOG_PREFERENCES))
  const isCatalogLoading = ref(false)
  const isCatalogSaving = ref(false)
  const catalogError = ref<string | null>(null)
  const isCatalogLoaded = ref(false)

  const hasCatalogChanges = computed(() => {
    return JSON.stringify(draftCatalog.value) !== JSON.stringify(savedCatalog.value)
  })

  // ── Branding methods ──

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

  // ── Catalog preferences methods ──

  async function fetchCatalogPreferences() {
    isCatalogLoading.value = true
    catalogError.value = null
    try {
      const response = await appearanceApi.getCatalogPreferences()
      if (response.success && response.data) {
        const merged = { ...deepClone(DEFAULT_CATALOG_PREFERENCES), ...response.data }
        savedCatalog.value = merged
        draftCatalog.value = deepClone(merged)
      }
      isCatalogLoaded.value = true
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Error al cargar preferencias de catálogo'
      catalogError.value = message
    } finally {
      isCatalogLoading.value = false
    }
  }

  async function saveCatalogPreferences(): Promise<boolean> {
    isCatalogSaving.value = true
    catalogError.value = null
    try {
      const response = await appearanceApi.updateCatalogPreferences(draftCatalog.value)
      if (response.success && response.data) {
        const merged = { ...deepClone(DEFAULT_CATALOG_PREFERENCES), ...response.data }
        savedCatalog.value = merged
        draftCatalog.value = deepClone(merged)
      } else {
        savedCatalog.value = deepClone(draftCatalog.value)
      }
      return true
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Error al guardar preferencias de catálogo'
      catalogError.value = message
      return false
    } finally {
      isCatalogSaving.value = false
    }
  }

  function updateCatalogField<K extends keyof CatalogPreferences>(
    field: K,
    value: CatalogPreferences[K]
  ) {
    draftCatalog.value[field] = value
  }

  function resetCatalog() {
    draftCatalog.value = deepClone(savedCatalog.value)
  }

  return {
    // Branding
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
    // Catalog
    savedCatalog,
    draftCatalog,
    isCatalogLoading,
    isCatalogSaving,
    catalogError,
    isCatalogLoaded,
    hasCatalogChanges,
    fetchCatalogPreferences,
    saveCatalogPreferences,
    updateCatalogField,
    resetCatalog,
  }
})
