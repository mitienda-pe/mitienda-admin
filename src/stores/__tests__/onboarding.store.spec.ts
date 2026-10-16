import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useOnboardingStore } from '@/stores/onboarding.store'
import type { OnboardingProgress, OnboardingStepProgress } from '@/types/onboarding.types'

vi.mock('@/api/onboarding.api', () => ({
  onboardingApi: {
    getProgress: vi.fn(),
    recordEvent: vi.fn()
  }
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ selectedStore: { id: 42, slug: 'demo' } })
}))

import { onboardingApi } from '@/api/onboarding.api'

// ─── Fixtures ────────────────────────────────────────────────

function step(
  key: OnboardingStepProgress['key'],
  done = false,
  applicable = true
): OnboardingStepProgress {
  return { key, done, applicable, meta: {} }
}

function makeProgress(overrides: Partial<OnboardingProgress> = {}): OnboardingProgress {
  return {
    steps: [
      step('first_product', true),
      step('payments'),
      step('shipping'),
      step('branding'),
      step('share_store'),
      step('choose_plan', false, true)
    ],
    completed_count: 1,
    total: 6,
    completed: false,
    dismissed_at: null,
    tours_completed: [],
    ...overrides
  }
}

describe('onboarding.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    vi.mocked(onboardingApi.recordEvent).mockResolvedValue({ success: true, data: { event: 'x' } })
  })

  it('carga el progreso del API y arma los pasos en el orden del checklist', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    const store = useOnboardingStore()

    await store.fetchProgress()

    expect(store.steps.map(s => s.key)).toEqual([
      'first_product',
      'payments',
      'shipping',
      'branding',
      'share_store',
      'choose_plan'
    ])
    expect(store.steps[0]!.title).toBe('Sube tu primer producto (con foto)')
    expect(store.completedCount).toBe(1)
    expect(store.totalCount).toBe(6)
    expect(store.percentage).toBe(17)
    expect(store.isAllComplete).toBe(false)
  })

  it('omite los pasos que no aplican (plan pagado) del total', async () => {
    const progress = makeProgress()
    progress.steps[5] = step('choose_plan', false, false)
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: progress })
    const store = useOnboardingStore()

    await store.fetchProgress()

    expect(store.steps.find(s => s.key === 'choose_plan')).toBeUndefined()
    expect(store.totalCount).toBe(5)
  })

  it('reutiliza la petición en curso', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    const store = useOnboardingStore()

    await Promise.all([store.fetchProgress(), store.fetchProgress()])

    expect(onboardingApi.getProgress).toHaveBeenCalledTimes(1)
  })

  it('expone el error si el API falla', async () => {
    vi.mocked(onboardingApi.getProgress).mockRejectedValue(new Error('network'))
    const store = useOnboardingStore()

    await store.fetchProgress()

    expect(store.error).toBeTruthy()
    expect(store.steps).toEqual([])
  })

  it('usa el dismissedAt viejo de localStorage solo como respaldo si el API falla', async () => {
    localStorage.setItem(
      'onboarding_42',
      JSON.stringify({ welcome: true, dismissedAt: '2026-01-01' })
    )
    vi.mocked(onboardingApi.getProgress).mockRejectedValue(new Error('network'))
    const store = useOnboardingStore()
    store.restore()

    await store.fetchProgress()
    expect(store.isDismissed).toBe(true)

    // Con respuesta del API manda el servidor.
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    await store.fetchProgress()
    expect(store.isDismissed).toBe(false)
  })

  it('abrir la tienda marca el paso al instante y registra el evento', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    const store = useOnboardingStore()
    await store.fetchProgress()

    await store.markStoreLinkOpened()

    expect(store.steps.find(s => s.key === 'share_store')!.done).toBe(true)
    expect(store.completedCount).toBe(2)
    expect(onboardingApi.recordEvent).toHaveBeenCalledWith('store_link_opened')
  })

  it('ocultar queda en el servidor y en el respaldo local', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    const store = useOnboardingStore()
    await store.fetchProgress()

    await store.dismiss()

    expect(store.isDismissed).toBe(true)
    expect(onboardingApi.recordEvent).toHaveBeenCalledWith('dismissed')
    expect(JSON.parse(localStorage.getItem('onboarding_42')!).dismissedAt).toBeTruthy()
  })

  it('terminar un recorrido se registra pero no marca ningún paso', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    const store = useOnboardingStore()
    await store.fetchProgress()

    await store.completeTour('payments')

    expect(onboardingApi.recordEvent).toHaveBeenCalledWith('tour_completed:payments')
    expect(store.toursCompleted).toContain('payments')
    expect(store.steps.find(s => s.key === 'payments')!.done).toBe(false)
  })

  it('auto-inicia la bienvenida solo si no se terminó ni se ocultó', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    const store = useOnboardingStore()
    expect(store.shouldAutoStart).toBe(false) // sin progreso todavía

    await store.fetchProgress()
    expect(store.shouldAutoStart).toBe(true)

    await store.completeTour('welcome-flow')
    expect(store.shouldAutoStart).toBe(false)
  })

  it('un evento que falla no rompe el flujo', async () => {
    vi.mocked(onboardingApi.getProgress).mockResolvedValue({ success: true, data: makeProgress() })
    vi.mocked(onboardingApi.recordEvent).mockRejectedValue(new Error('403'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const store = useOnboardingStore()
    await store.fetchProgress()

    await expect(store.markStoreLinkOpened()).resolves.toBeUndefined()
    expect(store.steps.find(s => s.key === 'share_store')!.done).toBe(true)
  })
})
