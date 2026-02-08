import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import appearanceApi from '@/api/appearance.api'
import type { StoreColorConfig } from '@/types/appearance.types'
import { DEFAULT_COLORS } from '@/types/appearance.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export const useAppearanceStore = defineStore('appearance', () => {
  const savedColors = ref<StoreColorConfig>(deepClone(DEFAULT_COLORS))
  const draftColors = ref<StoreColorConfig>(deepClone(DEFAULT_COLORS))
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  const hasUnsavedChanges = computed(() => {
    return JSON.stringify(draftColors.value) !== JSON.stringify(savedColors.value)
  })

  async function fetchColors() {
    isLoading.value = true
    error.value = null
    try {
      const response = await appearanceApi.getColors()
      if (response.success && response.data?.colors) {
        savedColors.value = response.data.colors
        draftColors.value = deepClone(response.data.colors)
      }
      isLoaded.value = true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar los colores'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function saveColors() {
    isSaving.value = true
    error.value = null
    try {
      const response = await appearanceApi.updateColors(draftColors.value)
      if (response.success && response.data?.colors) {
        savedColors.value = response.data.colors
        draftColors.value = deepClone(response.data.colors)
      } else {
        savedColors.value = deepClone(draftColors.value)
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al guardar los colores'
      error.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  function applyPreset(colors: StoreColorConfig) {
    draftColors.value = deepClone(colors)
  }

  function resetToSaved() {
    draftColors.value = deepClone(savedColors.value)
  }

  function updateSectionColor(
    section: keyof StoreColorConfig,
    field: string,
    value: string
  ) {
    const sectionObj = draftColors.value[section] as Record<string, string>
    if (field in sectionObj) {
      sectionObj[field] = value
    }
  }

  return {
    savedColors,
    draftColors,
    isLoading,
    isSaving,
    error,
    isLoaded,
    hasUnsavedChanges,
    fetchColors,
    saveColors,
    applyPreset,
    resetToSaved,
    updateSectionColor,
  }
})
