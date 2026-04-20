import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import { useAuthStore } from '@/stores/auth.store'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos

let pollTimer: ReturnType<typeof setInterval> | null = null

/**
 * Composable que arranca el fetch + polling de broadcasts para el backoffice.
 * Montar una sola vez en un componente raíz (ej. DashboardLayout).
 */
export function useBroadcasts() {
  const store = useBroadcastsStore()
  const authStore = useAuthStore()

  function tickIfReady() {
    if (!authStore.isAuthenticated || !authStore.selectedStore) return
    store.fetchActive()
  }

  onMounted(() => {
    tickIfReady()
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(tickIfReady, POLL_INTERVAL_MS)
  })

  watch(
    () => authStore.selectedStore?.id,
    (id, prev) => {
      if (id !== prev) {
        store.reset()
        tickIfReady()
      }
    }
  )

  onBeforeUnmount(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  })

  return {
    store,
    refresh: tickIfReady
  }
}
