import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth.store'

export interface OnboardingState {
  welcome: boolean
  products: boolean
  payments: boolean
  shipping: boolean
  dismissedAt: string | null
  completedAt: string | null
}

const DEFAULT_STATE: OnboardingState = {
  welcome: false,
  products: false,
  payments: false,
  shipping: false,
  dismissedAt: null,
  completedAt: null,
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const state = ref<OnboardingState>({ ...DEFAULT_STATE })
  const activeTourId = ref<string | null>(null)

  const storageKey = computed(() => {
    const authStore = useAuthStore()
    const storeId = authStore.selectedStore?.id
    return storeId ? `onboarding_${storeId}` : null
  })

  const isAllComplete = computed(() =>
    state.value.welcome &&
    state.value.products &&
    state.value.payments &&
    state.value.shipping
  )

  const isDismissed = computed(() => !!state.value.dismissedAt)

  const completedCount = computed(() =>
    [state.value.welcome, state.value.products, state.value.payments, state.value.shipping]
      .filter(Boolean).length
  )

  const setupProgress = computed(() => ({
    completed: completedCount.value,
    total: 4,
    percentage: Math.round((completedCount.value / 4) * 100),
  }))

  const shouldAutoStart = computed(() =>
    !state.value.welcome && !state.value.dismissedAt
  )

  function restore() {
    if (!storageKey.value) return
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      try {
        state.value = { ...DEFAULT_STATE, ...JSON.parse(saved) }
      } catch {
        state.value = { ...DEFAULT_STATE }
      }
    } else {
      state.value = { ...DEFAULT_STATE }
    }
  }

  function persist() {
    if (!storageKey.value) return
    localStorage.setItem(storageKey.value, JSON.stringify(state.value))
  }

  function completeTour(tourKey: keyof Omit<OnboardingState, 'dismissedAt' | 'completedAt'>) {
    state.value[tourKey] = true
    if (isAllComplete.value && !state.value.completedAt) {
      state.value.completedAt = new Date().toISOString()
    }
    persist()
  }

  function dismiss() {
    state.value.dismissedAt = new Date().toISOString()
    persist()
  }

  function reset() {
    state.value = { ...DEFAULT_STATE }
    persist()
  }

  function setActiveTour(tourId: string | null) {
    activeTourId.value = tourId
  }

  return {
    state,
    activeTourId,
    isAllComplete,
    isDismissed,
    completedCount,
    setupProgress,
    shouldAutoStart,
    restore,
    completeTour,
    dismiss,
    reset,
    setActiveTour,
  }
})
