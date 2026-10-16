import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'
import { onboardingApi } from '@/api/onboarding.api'
import { ONBOARDING_STEPS, type OnboardingStepDefinition } from '@/config/onboarding/steps'
import type {
  OnboardingEventKey,
  OnboardingProgress,
  OnboardingStepProgress
} from '@/types/onboarding.types'

export interface OnboardingChecklistStep extends OnboardingStepDefinition {
  done: boolean
  meta: Record<string, unknown>
}

/**
 * Checklist "Configura tu tienda".
 *
 * El progreso lo calcula el API desde los datos reales de la tienda
 * (GET /onboarding/progress); lo que no deja rastro (link abierto, ocultar,
 * recorridos terminados) se guarda con POST /onboarding/events.
 *
 * Antes todo vivía en localStorage (`onboarding_<storeId>`) y un paso quedaba
 * "hecho" al terminar el recorrido guiado. De ese estado viejo solo se usa
 * `dismissedAt`, y solo si el API falla: así quien ya lo había ocultado no lo
 * ve reaparecer por un error de red.
 */
export const useOnboardingStore = defineStore('onboarding', () => {
  const progress = ref<OnboardingProgress | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeTourId = ref<string | null>(null)
  const legacyDismissedAt = ref<string | null>(null)

  let inFlight: Promise<void> | null = null

  const legacyStorageKey = computed(() => {
    const authStore = useAuthStore()
    const storeId = authStore.selectedStore?.id
    return storeId ? `onboarding_${storeId}` : null
  })

  const steps = computed<OnboardingChecklistStep[]>(() => {
    if (!progress.value) return []
    const byKey = new Map<string, OnboardingStepProgress>(progress.value.steps.map(s => [s.key, s]))
    return ONBOARDING_STEPS.flatMap(def => {
      const p = byKey.get(def.key)
      if (!p || !p.applicable) return []
      return [{ ...def, done: p.done, meta: p.meta ?? {} }]
    })
  })

  const completedCount = computed(() => steps.value.filter(s => s.done).length)
  const totalCount = computed(() => steps.value.length)
  const isAllComplete = computed(
    () => totalCount.value > 0 && completedCount.value === totalCount.value
  )
  const percentage = computed(() =>
    totalCount.value ? Math.round((completedCount.value / totalCount.value) * 100) : 0
  )

  const isDismissed = computed(() =>
    progress.value ? !!progress.value.dismissed_at : !!legacyDismissedAt.value
  )

  const toursCompleted = computed(() => progress.value?.tours_completed ?? [])

  /** El recorrido de bienvenida se lanza solo si nunca se terminó ni se ocultó el checklist. */
  const shouldAutoStart = computed(
    () => !!progress.value && !isDismissed.value && !toursCompleted.value.includes('welcome-flow')
  )

  /** Lee del estado viejo de localStorage solo `dismissedAt` (respaldo si el API falla). */
  function restore() {
    // No toca `progress`: el layout llama esto DESPUÉS de que la vista hija
    // (dashboard) ya pidió el progreso, y lo pisaría.
    legacyDismissedAt.value = null
    if (!legacyStorageKey.value) return
    try {
      const saved = localStorage.getItem(legacyStorageKey.value)
      if (saved) legacyDismissedAt.value = JSON.parse(saved)?.dismissedAt ?? null
    } catch {
      legacyDismissedAt.value = null
    }
  }

  function fetchProgress(): Promise<void> {
    if (inFlight) return inFlight
    loading.value = true
    error.value = null
    inFlight = (async () => {
      try {
        const res = await onboardingApi.getProgress()
        if (res.success && res.data) {
          progress.value = res.data
        } else {
          error.value = res.message || 'No se pudo cargar el progreso de tu tienda'
        }
      } catch (e: any) {
        error.value = e?.response?.data?.message || 'No se pudo cargar el progreso de tu tienda'
      } finally {
        loading.value = false
        inFlight = null
      }
    })()
    return inFlight
  }

  /** Registra el evento en el API. Falla en silencio: es telemetría de progreso, no bloquea nada. */
  async function recordEvent(event: OnboardingEventKey): Promise<boolean> {
    try {
      const res = await onboardingApi.recordEvent(event)
      return !!res.success
    } catch (e) {
      console.warn('[onboarding] no se pudo registrar el evento', event, e)
      return false
    }
  }

  function markStepDone(key: OnboardingStepProgress['key'], meta: Record<string, unknown> = {}) {
    if (!progress.value) return
    const step = progress.value.steps.find(s => s.key === key)
    if (!step || step.done) return
    step.done = true
    step.meta = { ...step.meta, ...meta }
    progress.value.completed_count = progress.value.steps.filter(s => s.applicable && s.done).length
    progress.value.completed = progress.value.completed_count === progress.value.total
  }

  async function markStoreLinkOpened() {
    markStepDone('share_store', { opened_at: new Date().toISOString() })
    await recordEvent('store_link_opened')
  }

  async function dismiss() {
    const now = new Date().toISOString()
    if (progress.value) progress.value.dismissed_at = now
    legacyDismissedAt.value = now
    // Respaldo local por si el API falla ahora o en la próxima carga.
    if (legacyStorageKey.value) {
      try {
        const saved = JSON.parse(localStorage.getItem(legacyStorageKey.value) || '{}')
        localStorage.setItem(legacyStorageKey.value, JSON.stringify({ ...saved, dismissedAt: now }))
      } catch {
        /* almacenamiento no disponible: el API es la fuente */
      }
    }
    await recordEvent('dismissed')
  }

  async function completeTour(tourId: string) {
    if (progress.value && !progress.value.tours_completed.includes(tourId)) {
      progress.value.tours_completed = [...progress.value.tours_completed, tourId]
    }
    await recordEvent(`tour_completed:${tourId}`)
  }

  function setActiveTour(tourId: string | null) {
    activeTourId.value = tourId
  }

  return {
    progress,
    loading,
    error,
    activeTourId,
    steps,
    completedCount,
    totalCount,
    isAllComplete,
    percentage,
    isDismissed,
    toursCompleted,
    shouldAutoStart,
    restore,
    fetchProgress,
    recordEvent,
    markStoreLinkOpened,
    dismiss,
    completeTour,
    setActiveTour
  }
})
