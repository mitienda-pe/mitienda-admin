import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import { useAuthStore } from '@/stores/auth.store'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos
// Al cambiar de pantalla se vuelve a consultar, pero no más de una vez por minuto.
const NAV_REFETCH_MIN_MS = 60 * 1000
const CLOCK_INTERVAL_MS = 1000

let pollTimer: ReturnType<typeof setInterval> | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null
let removeNavHook: (() => void) | null = null

/**
 * Composable que arranca el fetch + polling de broadcasts para el backoffice.
 * Montar una sola vez en un componente raíz (ej. DashboardLayout).
 */
export function useBroadcasts() {
  const store = useBroadcastsStore()
  const authStore = useAuthStore()
  const router = useRouter()

  function tickIfReady() {
    if (!authStore.isAuthenticated || !authStore.selectedStore) return
    store.fetchActive()
  }

  onMounted(() => {
    tickIfReady()
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(tickIfReady, POLL_INTERVAL_MS)

    if (clockTimer) clearInterval(clockTimer)
    let last = Date.now()
    clockTimer = setInterval(() => {
      const current = Date.now()
      store.tick(current - last, document.visibilityState === 'visible')
      last = current
      if (store.takeExpiredHidden()) tickIfReady()
    }, CLOCK_INTERVAL_MS)

    removeNavHook?.()
    removeNavHook = router.afterEach((to, from) => {
      // Cambiar filtros o paginar (solo query string) no cuenta como otra pantalla.
      if (to.path === from.path) return
      store.onNavigate()
      if (Date.now() - store.lastFetchAt > NAV_REFETCH_MIN_MS) tickIfReady()
    })
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
    if (clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
    removeNavHook?.()
    removeNavHook = null
  })

  return {
    store,
    refresh: tickIfReady
  }
}
