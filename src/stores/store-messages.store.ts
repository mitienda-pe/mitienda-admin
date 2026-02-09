import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storeApi } from '@/api/store.api'
import type { StoreMessages } from '@/types/store.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_MESSAGES: StoreMessages = {
  tiendageneral_texto_entregadomicilio: null,
  tiendageneral_texto_recojoentienda: null,
  tiendageneral_texto_paginaconfirmacion: null,
  tiendageneral_texto_desactivado: null
}

export const useStoreMessagesStore = defineStore('store-messages', () => {
  const savedMessages = ref<StoreMessages>(deepClone(DEFAULT_MESSAGES))
  const draftMessages = ref<StoreMessages>(deepClone(DEFAULT_MESSAGES))

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  const hasChanges = computed(() => {
    return JSON.stringify(draftMessages.value) !== JSON.stringify(savedMessages.value)
  })

  async function fetchMessages() {
    isLoading.value = true
    error.value = null
    try {
      const response = await storeApi.getMessages()
      if (response.success && response.data) {
        savedMessages.value = response.data
        draftMessages.value = deepClone(response.data)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al cargar los mensajes'
      error.value = message
    } finally {
      isLoading.value = false
    }
  }

  async function saveMessages(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const response = await storeApi.updateMessages(draftMessages.value)
      if (response.success && response.data) {
        savedMessages.value = response.data
        draftMessages.value = deepClone(response.data)
      } else {
        savedMessages.value = deepClone(draftMessages.value)
      }
      return true
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al guardar los mensajes'
      error.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  function updateField<K extends keyof StoreMessages>(field: K, value: StoreMessages[K]) {
    draftMessages.value[field] = value
  }

  return {
    savedMessages,
    draftMessages,
    isLoading,
    isSaving,
    error,
    hasChanges,
    fetchMessages,
    saveMessages,
    updateField
  }
})
