import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { broadcastsApi } from '@/api/broadcasts.api'
import type { Broadcast } from '@/types/broadcast.types'

const LOCAL_DISMISSED_KEY = 'broadcast_dismissed_ids_v1'

function readLocalDismissed(): number[] {
  try {
    const raw = localStorage.getItem(LOCAL_DISMISSED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

function writeLocalDismissed(ids: number[]) {
  try {
    localStorage.setItem(LOCAL_DISMISSED_KEY, JSON.stringify(Array.from(new Set(ids)).slice(-200)))
  } catch {
    // storage lleno / modo privado — seguimos sin bloquear
  }
}

export const useBroadcastsStore = defineStore('broadcasts', () => {
  const items = ref<Broadcast[]>([])
  const dismissedIds = ref<number[]>(readLocalDismissed())
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
    writeLocalDismissed(dismissedIds.value)

    try {
      await broadcastsApi.dismiss(id)
    } catch {
      // si falla, mantenemos el dismiss local para UX; se reintentará en próximo fetch
    }
  }

  function reset() {
    items.value = []
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
