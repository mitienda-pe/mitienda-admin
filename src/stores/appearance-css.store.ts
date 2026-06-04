import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import appearanceApi from '@/api/appearance.api'

export const useAppearanceCssStore = defineStore('appearance-css', () => {
  const savedCss = ref('')
  const draftCss = ref('')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  const hasUnsavedChanges = computed(() => draftCss.value !== savedCss.value)

  async function fetchCss() {
    isLoading.value = true
    error.value = null
    try {
      const response = await appearanceApi.getCustomCss()
      if (response.success) {
        savedCss.value = response.data?.css ?? ''
        draftCss.value = savedCss.value
      }
      isLoaded.value = true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar el CSS personalizado'
    } finally {
      isLoading.value = false
    }
  }

  async function saveCss() {
    isSaving.value = true
    error.value = null
    try {
      const response = await appearanceApi.updateCustomCss(draftCss.value)
      // El backend devuelve el CSS ya sanitizado: lo adoptamos como verdad.
      const sanitized = response.success ? (response.data?.css ?? draftCss.value) : draftCss.value
      savedCss.value = sanitized
      draftCss.value = sanitized
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al guardar el CSS personalizado'
      return false
    } finally {
      isSaving.value = false
    }
  }

  function resetToSaved() {
    draftCss.value = savedCss.value
  }

  return {
    savedCss,
    draftCss,
    isLoading,
    isSaving,
    error,
    isLoaded,
    hasUnsavedChanges,
    fetchCss,
    saveCss,
    resetToSaved,
  }
})
