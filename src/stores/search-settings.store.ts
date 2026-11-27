import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { searchSettingsApi } from '@/api/search-settings.api'
import type { StoreSearchSettings } from '@/types/search-settings.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_SETTINGS: StoreSearchSettings = {
  strict_mode: false,
  synonyms: []
}

/** Grupos sin términos vacíos ni grupos en blanco, para comparar y enviar. */
function cleanGroups(groups: string[][]): string[][] {
  return groups
    .map(g => g.map(t => t.trim()).filter(t => t !== ''))
    .filter(g => g.length > 0)
}

function apiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || fallback
}

export const useSearchSettingsStore = defineStore('searchSettings', () => {
  const savedSettings = ref<StoreSearchSettings>(deepClone(DEFAULT_SETTINGS))
  const draftSettings = ref<StoreSearchSettings>(deepClone(DEFAULT_SETTINGS))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  const lastMessage = ref<string | null>(null)

  const hasChanges = computed(
    () =>
      draftSettings.value.strict_mode !== savedSettings.value.strict_mode ||
      JSON.stringify(cleanGroups(draftSettings.value.synonyms)) !==
        JSON.stringify(cleanGroups(savedSettings.value.synonyms))
  )

  function applyResponse(data: StoreSearchSettings) {
    const merged = { ...deepClone(DEFAULT_SETTINGS), ...data, limits: data.limits ?? savedSettings.value.limits }
    savedSettings.value = merged
    draftSettings.value = deepClone(merged)
  }

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const response = await searchSettingsApi.getSettings()
      if (response.success && response.data) applyResponse(response.data)
    } catch (e: unknown) {
      error.value = apiErrorMessage(e, 'Error al cargar los ajustes del buscador')
    } finally {
      isLoading.value = false
    }
  }

  async function saveSettings(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    lastMessage.value = null
    try {
      const response = await searchSettingsApi.updateSettings({
        strict_mode: draftSettings.value.strict_mode,
        synonyms: cleanGroups(draftSettings.value.synonyms)
      })
      if (response.success && response.data) applyResponse(response.data)
      lastMessage.value = response.message ?? null
      return true
    } catch (e: unknown) {
      error.value = apiErrorMessage(e, 'Error al guardar los ajustes del buscador')
      return false
    } finally {
      isSaving.value = false
    }
  }

  function addGroup() {
    draftSettings.value.synonyms.push([])
  }

  function removeGroup(index: number) {
    draftSettings.value.synonyms.splice(index, 1)
  }

  return {
    savedSettings,
    draftSettings,
    isLoading,
    isSaving,
    error,
    lastMessage,
    hasChanges,
    fetchSettings,
    saveSettings,
    addGroup,
    removeGroup
  }
})
