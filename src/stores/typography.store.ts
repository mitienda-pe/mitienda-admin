import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import appearanceApi from '@/api/appearance.api'
import type { StoreTypographyConfig, SectionTypography } from '@/types/appearance.types'
import { DEFAULT_TYPOGRAPHY } from '@/types/appearance.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function loadGoogleFont(family: string, weights = [400, 700]) {
  const id = `gf-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=swap`
  document.head.appendChild(link)
}

export const useTypographyStore = defineStore('typography', () => {
  const savedTypography = ref<StoreTypographyConfig>(deepClone(DEFAULT_TYPOGRAPHY))
  const draftTypography = ref<StoreTypographyConfig>(deepClone(DEFAULT_TYPOGRAPHY))
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const isLoaded = ref(false)

  const hasUnsavedChanges = computed(() => {
    return JSON.stringify(draftTypography.value) !== JSON.stringify(savedTypography.value)
  })

  function loadAllDraftFonts() {
    const sections: (keyof Omit<StoreTypographyConfig, 'scale'>)[] = [
      'header',
      'navbar',
      'body',
      'footer',
    ]
    for (const s of sections) {
      const sec = draftTypography.value[s] as SectionTypography
      loadGoogleFont(sec.headingFont)
      loadGoogleFont(sec.bodyFont)
    }
  }

  async function fetchTypography() {
    isLoading.value = true
    error.value = null
    try {
      const response = await appearanceApi.getTypography()
      if (response.success && response.data?.typography) {
        savedTypography.value = response.data.typography
        draftTypography.value = deepClone(response.data.typography)
      }
      isLoaded.value = true
      loadAllDraftFonts()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar la tipografía'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function saveTypography() {
    isSaving.value = true
    error.value = null
    try {
      const response = await appearanceApi.updateTypography(draftTypography.value)
      if (response.success && response.data?.typography) {
        savedTypography.value = response.data.typography
        draftTypography.value = deepClone(response.data.typography)
      } else {
        savedTypography.value = deepClone(draftTypography.value)
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al guardar la tipografía'
      error.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  function applyPreset(headingFont: string, bodyFont: string) {
    const sections: (keyof Omit<StoreTypographyConfig, 'scale'>)[] = [
      'header',
      'navbar',
      'body',
      'footer',
    ]
    for (const s of sections) {
      draftTypography.value[s] = { headingFont, bodyFont }
    }
    loadGoogleFont(headingFont)
    loadGoogleFont(bodyFont)
  }

  function resetToSaved() {
    draftTypography.value = deepClone(savedTypography.value)
    loadAllDraftFonts()
  }

  function updateSectionFont(
    section: keyof Omit<StoreTypographyConfig, 'scale'>,
    field: 'headingFont' | 'bodyFont',
    value: string
  ) {
    draftTypography.value[section][field] = value
    loadGoogleFont(value)
  }

  function updateScale(value: number) {
    draftTypography.value.scale = value
  }

  return {
    savedTypography,
    draftTypography,
    isLoading,
    isSaving,
    error,
    isLoaded,
    hasUnsavedChanges,
    fetchTypography,
    saveTypography,
    applyPreset,
    resetToSaved,
    updateSectionFont,
    updateScale,
  }
})
