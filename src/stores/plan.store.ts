import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { planApi } from '@/api/plan.api'
import type { StorePlanInfo, PlanModule, SubscriptionHistoryItem } from '@/types/plan.types'
import { MODULE_ROUTE_MAP, ALWAYS_ACCESSIBLE_ROUTES } from '@/config/plan-modules.config'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const STORAGE_KEY = 'plan_info'

export const usePlanStore = defineStore('plan', () => {
  // State
  const planInfo = ref<StorePlanInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<number | null>(null)

  // Subscription history state
  const subscriptionHistory = ref<SubscriptionHistoryItem[]>([])
  const isLoadingHistory = ref(false)
  const historyError = ref<string | null>(null)

  // Upgrade modal state
  const upgradeModalVisible = ref(false)
  const upgradeModalModule = ref<PlanModule | null>(null)

  // Getters
  const plan = computed(() => planInfo.value?.plan ?? null)
  const modules = computed(() => planInfo.value?.modules ?? [])
  const quotas = computed(() => planInfo.value?.quotas ?? null)

  const enabledModuleCodes = computed(() =>
    modules.value.filter(m => m.enabled).map(m => m.code)
  )

  const hasPlan = computed(() => !!plan.value)

  const isPlanExpired = computed(() => plan.value?.status === 'expired')

  const isPlanTrial = computed(() => plan.value?.is_trial ?? false)

  // Methods

  /**
   * Check if a specific module code is enabled in the current plan
   */
  function isModuleEnabled(moduleCode: string): boolean {
    if (!planInfo.value) return true // Not loaded yet, allow access
    const mod = modules.value.find(m => m.code === moduleCode)
    if (!mod) return true // Module not in plan definition, allow access
    return mod.enabled
  }

  /**
   * Check if a route path is accessible based on the current plan's modules
   */
  function isRouteAccessible(routePath: string): boolean {
    if (!planInfo.value) return true // Not loaded yet

    // Always-accessible routes
    if (ALWAYS_ACCESSIBLE_ROUTES.some(r => routePath.startsWith(r))) return true

    // Check each module's routes
    for (const [moduleCode, paths] of Object.entries(MODULE_ROUTE_MAP)) {
      if (paths.some(p => routePath.startsWith(p))) {
        return isModuleEnabled(moduleCode)
      }
    }

    // Route not mapped to any module = always accessible
    return true
  }

  /**
   * Get the PlanModule associated with a route path (for showing in upgrade modal)
   */
  function getModuleForRoute(routePath: string): PlanModule | null {
    for (const [moduleCode, paths] of Object.entries(MODULE_ROUTE_MAP)) {
      if (paths.some(p => routePath.startsWith(p))) {
        return modules.value.find(m => m.code === moduleCode) ?? null
      }
    }
    return null
  }

  /**
   * Get the minimum plan name required for a route path (for colored lock icons)
   */
  function getMinimumPlanForRoute(routePath: string): string | null {
    const mod = getModuleForRoute(routePath)
    return mod?.minimum_plan ?? null
  }

  /**
   * Fetch plan data from the API with caching
   */
  async function fetchPlan() {
    // Use cache if still valid
    if (lastFetchedAt.value && Date.now() - lastFetchedAt.value < CACHE_TTL) return

    isLoading.value = true
    error.value = null
    try {
      const response = await planApi.getMyPlan()
      if (response.success && response.data) {
        planInfo.value = response.data
        lastFetchedAt.value = Date.now()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data))
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar información del plan'
      console.error('Error fetching plan:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Restore plan data from localStorage (for instant display on page load)
   */
  function restorePlan() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        planInfo.value = JSON.parse(saved)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  /**
   * Force refresh plan data (bypasses cache). Use after quota-related errors.
   */
  async function refreshPlan() {
    lastFetchedAt.value = null
    await fetchPlan()
  }

  /**
   * Clear plan data (on logout or store change)
   */
  function clearPlan() {
    planInfo.value = null
    lastFetchedAt.value = null
    error.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Fetch subscription history from the API
   */
  async function fetchSubscriptionHistory() {
    isLoadingHistory.value = true
    historyError.value = null
    try {
      const response = await planApi.getSubscriptionHistory()
      if (response.success && response.data) {
        subscriptionHistory.value = response.data
      }
    } catch (e: any) {
      historyError.value = e.message || 'Error al cargar el historial'
      console.error('Error fetching subscription history:', e)
    } finally {
      isLoadingHistory.value = false
    }
  }

  // Quota helpers

  function canAddProduct(): boolean {
    if (!quotas.value) return true
    if (quotas.value.max_products === 0) return true // 0 = unlimited
    return quotas.value.current_products < quotas.value.max_products
  }

  function canAddPage(): boolean {
    if (!quotas.value) return true
    if (quotas.value.max_pages === 0) return true // 0 = unlimited
    return quotas.value.current_pages < quotas.value.max_pages
  }

  function canAddUser(): boolean {
    if (!quotas.value) return true
    if (quotas.value.max_users === 0) return true // 0 = unlimited
    return quotas.value.current_users < quotas.value.max_users
  }

  // Upgrade modal

  function showUpgradeModal(mod: PlanModule | null) {
    upgradeModalModule.value = mod
    upgradeModalVisible.value = true
  }

  function hideUpgradeModal() {
    upgradeModalVisible.value = false
    upgradeModalModule.value = null
  }

  return {
    // State
    planInfo,
    isLoading,
    error,
    subscriptionHistory,
    isLoadingHistory,
    historyError,
    upgradeModalVisible,
    upgradeModalModule,
    // Getters
    plan,
    modules,
    quotas,
    enabledModuleCodes,
    hasPlan,
    isPlanExpired,
    isPlanTrial,
    // Methods
    isModuleEnabled,
    isRouteAccessible,
    getModuleForRoute,
    getMinimumPlanForRoute,
    // Actions
    fetchPlan,
    refreshPlan,
    restorePlan,
    clearPlan,
    fetchSubscriptionHistory,
    // Quota helpers
    canAddProduct,
    canAddPage,
    canAddUser,
    // Modal
    showUpgradeModal,
    hideUpgradeModal
  }
})
