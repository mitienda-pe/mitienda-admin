import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { broadcastsApi } from '@/api/broadcasts.api'
import type { Broadcast } from '@/types/broadcast.types'

// Limpieza de la clave que persistia los descartes en el navegador y dejaba
// inutil el "Resetear" del superadmin. Se puede borrar en unos meses.
try {
  localStorage.removeItem('broadcast_dismissed_ids_v1')
} catch {
  // modo privado / storage bloqueado
}

export const useBroadcastsStore = defineStore('broadcasts', () => {
  const items = ref<Broadcast[]>([])
  // Solo en memoria, a proposito: sirve para ocultar el aviso mientras el POST
  // de dismiss viaja. La verdad la tiene el servidor — getActive() ya excluye
  // los descartados. Si esto se persistiera en localStorage, el boton
  // "Resetear" del superadmin no tendria efecto: el navegador seguiria
  // filtrando el aviso aunque el backend volviera a mandarlo.
  const dismissedIds = ref<number[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const visibleItems = computed(() =>
    items.value.filter((b) => !dismissedIds.value.includes(b.id))
  )
  const activeBars = computed(() =>
    visibleItems.value.filter((b) => b.placement === 'bar')
  )
  const activeModals = computed(() =>
    visibleItems.value.filter((b) => b.placement === 'modal')
  )

  async function fetchActive() {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null
    try {
      items.value = await broadcastsApi.getActive()
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar avisos'
    } finally {
      isLoading.value = false
    }
  }

  async function dismiss(id: number) {
    const broadcast = items.value.find((b) => b.id === id)
    if (!broadcast || !broadcast.is_dismissible) return

    dismissedIds.value = [...dismissedIds.value, id]

    try {
      await broadcastsApi.dismiss(id)
    } catch {
      // Si falla, lo mantenemos oculto en esta vista por UX. Al recargar
      // volvera a aparecer, que es lo correcto: el servidor nunca registro
      // el descarte.
    }
  }

  function reset() {
    items.value = []
    dismissedIds.value = []
    error.value = null
  }

  return {
    items,
    dismissedIds,
    isLoading,
    error,
    visibleItems,
    activeBars,
    activeModals,
    fetchActive,
    dismiss,
    reset
  }
})
