import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { broadcastsApi } from '@/api/broadcasts.api'
import type { Broadcast, BroadcastSeverity } from '@/types/broadcast.types'

// Limpieza de la clave que persistia los descartes en el navegador y dejaba
// inutil el "Resetear" del superadmin. Se puede borrar en unos meses.
try {
  localStorage.removeItem('broadcast_dismissed_ids_v1')
} catch {
  // modo privado / storage bloqueado
}

const RESHOW_GRACE_MS = 5000

const severityRank = (s: BroadcastSeverity) =>
  s === 'danger' ? 0 : s === 'warning' ? 1 : 2

/**
 * Cómo quedó oculto un aviso en esta pestaña tras cerrarlo:
 * - until: vuelve a verse cuando el reloj pase esa marca (reshow_after_minutes > 0).
 * - nav:   vuelve a verse al cambiar de pantalla (reshow_after_minutes = 0).
 * - forever: no vuelve en esta sesión (reshow_after_minutes = null).
 */
type Hidden =
  | { kind: 'until'; at: number }
  | { kind: 'nav'; seq: number }
  | { kind: 'forever' }

export const useBroadcastsStore = defineStore('broadcasts', () => {
  const items = ref<Broadcast[]>([])
  // Solo en memoria, a proposito: sirve para ocultar el aviso mientras el POST
  // de dismiss viaja y para manejar la reaparicion. La verdad la tiene el
  // servidor — getActive() ya excluye los descartados vigentes. Si esto se
  // persistiera en localStorage, el boton "Resetear" del superadmin no tendria
  // efecto.
  const hidden = ref<Record<number, Hidden>>({})
  // Milisegundos que cada aviso lleva a la vista (con la pestaña visible)
  // desde que apareció. Alimenta la cuenta regresiva de dismiss_delay_seconds.
  const elapsedMs = ref<Record<number, number>>({})
  const now = ref(Date.now())
  const navSeq = ref(0)
  const isLoading = ref(false)
  const lastFetchAt = ref(0)
  const error = ref<string | null>(null)

  function isHidden(id: number): boolean {
    const h = hidden.value[id]
    if (!h) return false
    if (h.kind === 'forever') return true
    if (h.kind === 'nav') return h.seq === navSeq.value
    return h.at > now.value
  }

  const visibleItems = computed(() => items.value.filter((b) => !isHidden(b.id)))

  const activeBars = computed(() =>
    visibleItems.value
      .filter((b) => b.placement === 'bar')
      .sort((a, b) => {
        const byRank = severityRank(a.severity) - severityRank(b.severity)
        if (byRank !== 0) return byRank
        return (b.published_at || '').localeCompare(a.published_at || '')
      })
  )

  const activeModals = computed(() =>
    visibleItems.value.filter((b) => b.placement === 'modal')
  )

  /** El modal que se muestra: primero los no cerrables, luego por severidad y fecha. */
  const currentModal = computed<Broadcast | null>(() => {
    const sorted = [...activeModals.value].sort((a, b) => {
      if (a.is_dismissible !== b.is_dismissible) return a.is_dismissible ? 1 : -1
      const byRank = severityRank(a.severity) - severityRank(b.severity)
      if (byRank !== 0) return byRank
      return (b.published_at || '').localeCompare(a.published_at || '')
    })
    return sorted[0] ?? null
  })

  /** Segundos que faltan para poder cerrar el aviso (0 = ya se puede). */
  function secondsUntilClosable(b: Broadcast): number {
    if (!b.is_dismissible || !b.dismiss_delay_seconds) return 0
    const remainingMs = b.dismiss_delay_seconds * 1000 - (elapsedMs.value[b.id] ?? 0)
    return Math.max(0, Math.ceil(remainingMs / 1000))
  }

  function canClose(b: Broadcast): boolean {
    return b.is_dismissible && secondsUntilClosable(b) === 0
  }

  /**
   * Avanza el reloj. La cuenta regresiva solo corre para lo que está
   * realmente en pantalla (barras visibles + el modal actual) y con la pestaña
   * visible: dejar el aviso abierto en otra pestaña no cuenta.
   */
  function tick(deltaMs: number, pageVisible: boolean) {
    now.value = Date.now()
    if (!pageVisible) return
    const onScreen = [...activeBars.value, ...(currentModal.value ? [currentModal.value] : [])]
    for (const b of onScreen) {
      if (!b.dismiss_delay_seconds || secondsUntilClosable(b) === 0) continue
      elapsedMs.value[b.id] = (elapsedMs.value[b.id] ?? 0) + deltaMs
    }
  }

  /**
   * Quita las marcas "oculto hasta" que ya vencieron y avisa si hubo alguna:
   * el servidor dejó de devolver esos avisos al cerrarlos, así que hay que
   * volver a consultar para que reaparezcan.
   */
  function takeExpiredHidden(): boolean {
    let expired = false
    for (const [id, h] of Object.entries(hidden.value)) {
      if (h.kind === 'until' && h.at <= now.value) {
        delete hidden.value[Number(id)]
        expired = true
      }
    }
    return expired
  }

  /** Se llama al cambiar de pantalla: reaparecen los avisos con reshow_after_minutes = 0. */
  function onNavigate() {
    navSeq.value++
  }

  async function fetchActive() {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null
    try {
      items.value = await broadcastsApi.getActive()
      lastFetchAt.value = Date.now()
    } catch (e: any) {
      error.value = e?.message || 'Error al cargar avisos'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cierra un aviso. `viaCta` permite cerrarlo antes de que termine la cuenta
   * regresiva: hacer clic en el botón de acción (ej. "Pagar") es justo lo que
   * buscamos.
   */
  async function dismiss(id: number, { viaCta = false } = {}) {
    const broadcast = items.value.find((b) => b.id === id)
    if (!broadcast || !broadcast.is_dismissible) return
    if (!viaCta && !canClose(broadcast)) return

    const reshow = broadcast.reshow_after_minutes
    hidden.value[id] =
      reshow === null
        ? { kind: 'forever' }
        : reshow === 0
          ? { kind: 'nav', seq: navSeq.value }
          : // Unos segundos de margen: el servidor cuenta desde que recibe el POST.
            { kind: 'until', at: Date.now() + reshow * 60_000 + RESHOW_GRACE_MS }
    // Al reaparecer, la espera para cerrar arranca de cero.
    delete elapsedMs.value[id]

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
    hidden.value = {}
    elapsedMs.value = {}
    lastFetchAt.value = 0
    error.value = null
  }

  return {
    items,
    isLoading,
    lastFetchAt,
    error,
    visibleItems,
    activeBars,
    activeModals,
    currentModal,
    secondsUntilClosable,
    canClose,
    tick,
    takeExpiredHidden,
    onNavigate,
    fetchActive,
    dismiss,
    reset
  }
})
