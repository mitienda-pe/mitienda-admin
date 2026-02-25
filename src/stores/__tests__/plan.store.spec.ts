import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlanStore } from '@/stores/plan.store'
import type { StorePlanInfo, PlanModule, PlanQuotas } from '@/types/plan.types'

vi.mock('@/api/plan.api', () => ({
  planApi: {
    getMyPlan: vi.fn()
  }
}))

import { planApi } from '@/api/plan.api'

// ─── Fixtures ────────────────────────────────────────────────

function makePlanInfo(overrides: Partial<StorePlanInfo> = {}): StorePlanInfo {
  return {
    plan: {
      id: 1,
      plan_id: 10,
      name: 'Plan Profesional',
      expires_at: '2026-12-31',
      days_remaining: 300,
      is_trial: false,
      status: 'active'
    },
    modules: [
      { code: 'mod_productos', name: 'Productos', group: 'Catálogo', enabled: true, minimum_plan: 'Micro' },
      { code: 'mod_categorias', name: 'Categorías', group: 'Catálogo', enabled: true, minimum_plan: 'Micro' },
      { code: 'mod_reportes_ventas', name: 'Reportes', group: 'Ventas', enabled: false, minimum_plan: 'Medium' },
      { code: 'mod_blog', name: 'Blog', group: 'Contenido', enabled: false, minimum_plan: 'Small' },
      { code: 'mod_paginas', name: 'Páginas', group: 'Contenido', enabled: true, minimum_plan: 'Small' }
    ],
    quotas: {
      max_products: 100,
      max_pages: 10,
      current_products: 50,
      current_pages: 5
    },
    ...overrides
  }
}

function makeQuotas(overrides: Partial<PlanQuotas> = {}): PlanQuotas {
  return { max_products: 100, max_pages: 10, current_products: 50, current_pages: 5, ...overrides }
}

// ─── Tests ───────────────────────────────────────────────────

describe('plan.store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Computed Getters ──────────────────────────────────────

  describe('computed getters', () => {
    it('returns null plan when planInfo is not loaded', () => {
      const store = usePlanStore()
      expect(store.plan).toBeNull()
      expect(store.modules).toEqual([])
      expect(store.quotas).toBeNull()
      expect(store.hasPlan).toBe(false)
    })

    it('derives plan, modules, quotas from planInfo', () => {
      const store = usePlanStore()
      const info = makePlanInfo()
      store.planInfo = info

      expect(store.plan).toEqual(info.plan)
      expect(store.modules).toEqual(info.modules)
      expect(store.quotas).toEqual(info.quotas)
      expect(store.hasPlan).toBe(true)
    })

    it('enabledModuleCodes returns only enabled modules', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()

      expect(store.enabledModuleCodes).toEqual([
        'mod_productos',
        'mod_categorias',
        'mod_paginas'
      ])
    })

    it('isPlanExpired detects expired status', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        plan: {
          id: 1, plan_id: 10, name: 'Plan Básico',
          expires_at: '2024-01-01', days_remaining: 0,
          is_trial: false, status: 'expired'
        }
      })
      expect(store.isPlanExpired).toBe(true)
    })

    it('isPlanTrial detects trial plans', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        plan: {
          id: 1, plan_id: 10, name: 'Trial',
          expires_at: '2026-12-31', days_remaining: 14,
          is_trial: true, status: 'trial'
        }
      })
      expect(store.isPlanTrial).toBe(true)
    })
  })

  // ── isModuleEnabled ───────────────────────────────────────

  describe('isModuleEnabled', () => {
    it('returns true when planInfo is not loaded (fail-open)', () => {
      const store = usePlanStore()
      expect(store.isModuleEnabled('mod_reportes_ventas')).toBe(true)
    })

    it('returns true for an enabled module', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isModuleEnabled('mod_productos')).toBe(true)
    })

    it('returns false for a disabled module', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isModuleEnabled('mod_reportes_ventas')).toBe(false)
    })

    it('returns true for a module code not in the plan definition (fail-open)', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isModuleEnabled('mod_unknown_feature')).toBe(true)
    })
  })

  // ── isRouteAccessible ─────────────────────────────────────

  describe('isRouteAccessible', () => {
    it('returns true when planInfo is not loaded (fail-open)', () => {
      const store = usePlanStore()
      expect(store.isRouteAccessible('/reports')).toBe(true)
    })

    it('allows always-accessible routes', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isRouteAccessible('/dashboard')).toBe(true)
      expect(store.isRouteAccessible('/customers')).toBe(true)
      expect(store.isRouteAccessible('/customers/123')).toBe(true)
      expect(store.isRouteAccessible('/profile')).toBe(true)
      expect(store.isRouteAccessible('/store-selection')).toBe(true)
    })

    it('allows route for an enabled module', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isRouteAccessible('/products')).toBe(true)
      expect(store.isRouteAccessible('/products/123/edit')).toBe(true)
    })

    it('blocks route for a disabled module', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isRouteAccessible('/reports')).toBe(false)
      expect(store.isRouteAccessible('/reports/orders/preview')).toBe(false)
      expect(store.isRouteAccessible('/blog')).toBe(false)
    })

    it('allows route not mapped to any module', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.isRouteAccessible('/some-unknown-route')).toBe(true)
    })
  })

  // ── getModuleForRoute ─────────────────────────────────────

  describe('getModuleForRoute', () => {
    it('returns matching module for a known route', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()

      const mod = store.getModuleForRoute('/products/123')
      expect(mod).toBeTruthy()
      expect(mod!.code).toBe('mod_productos')
    })

    it('returns null for unmapped route', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()

      expect(store.getModuleForRoute('/dashboard')).toBeNull()
      expect(store.getModuleForRoute('/unknown')).toBeNull()
    })

    it('returns null when module code exists in map but not in plan modules', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({ modules: [] })

      // mod_productos is mapped in MODULE_ROUTE_MAP but not in the empty modules list
      expect(store.getModuleForRoute('/products')).toBeNull()
    })
  })

  // ── getMinimumPlanForRoute ──────────────────────────────

  describe('getMinimumPlanForRoute', () => {
    it('returns minimum plan name for a disabled module route', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      // mod_reportes_ventas has minimum_plan: 'Medium'
      expect(store.getMinimumPlanForRoute('/reports')).toBe('Medium')
    })

    it('returns minimum plan name for an enabled module route', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      // mod_productos has minimum_plan: 'Micro'
      expect(store.getMinimumPlanForRoute('/products')).toBe('Micro')
    })

    it('returns null for unmapped route', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      expect(store.getMinimumPlanForRoute('/dashboard')).toBeNull()
    })

    it('returns null when planInfo not loaded', () => {
      const store = usePlanStore()
      expect(store.getMinimumPlanForRoute('/reports')).toBeNull()
    })
  })

  // ── Quota Helpers ─────────────────────────────────────────

  describe('canAddProduct', () => {
    it('returns true when quotas are not loaded', () => {
      const store = usePlanStore()
      expect(store.canAddProduct()).toBe(true)
    })

    it('returns true when max_products is 0 (unlimited)', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({ quotas: makeQuotas({ max_products: 0 }) })
      expect(store.canAddProduct()).toBe(true)
    })

    it('returns true when under quota', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        quotas: makeQuotas({ max_products: 100, current_products: 50 })
      })
      expect(store.canAddProduct()).toBe(true)
    })

    it('returns false when at quota limit', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        quotas: makeQuotas({ max_products: 100, current_products: 100 })
      })
      expect(store.canAddProduct()).toBe(false)
    })

    it('returns false when over quota limit', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        quotas: makeQuotas({ max_products: 50, current_products: 55 })
      })
      expect(store.canAddProduct()).toBe(false)
    })
  })

  describe('canAddPage', () => {
    it('returns true when quotas are not loaded', () => {
      const store = usePlanStore()
      expect(store.canAddPage()).toBe(true)
    })

    it('returns true when max_pages is 0 (unlimited)', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({ quotas: makeQuotas({ max_pages: 0 }) })
      expect(store.canAddPage()).toBe(true)
    })

    it('returns true when under quota', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        quotas: makeQuotas({ max_pages: 10, current_pages: 5 })
      })
      expect(store.canAddPage()).toBe(true)
    })

    it('returns false when at quota limit', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo({
        quotas: makeQuotas({ max_pages: 10, current_pages: 10 })
      })
      expect(store.canAddPage()).toBe(false)
    })
  })

  // ── fetchPlan ─────────────────────────────────────────────

  describe('fetchPlan', () => {
    it('fetches plan from API and stores result', async () => {
      const info = makePlanInfo()
      vi.mocked(planApi.getMyPlan).mockResolvedValue({
        success: true,
        message: 'OK',
        data: info
      })

      const store = usePlanStore()
      await store.fetchPlan()

      expect(planApi.getMyPlan).toHaveBeenCalledOnce()
      expect(store.planInfo).toEqual(info)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('persists plan to localStorage after fetch', async () => {
      const info = makePlanInfo()
      vi.mocked(planApi.getMyPlan).mockResolvedValue({
        success: true,
        message: 'OK',
        data: info
      })

      const store = usePlanStore()
      await store.fetchPlan()

      const saved = JSON.parse(localStorage.getItem('plan_info')!)
      expect(saved.plan.name).toBe('Plan Profesional')
    })

    it('uses cache within TTL window', async () => {
      const info = makePlanInfo()
      vi.mocked(planApi.getMyPlan).mockResolvedValue({
        success: true,
        message: 'OK',
        data: info
      })

      const store = usePlanStore()
      await store.fetchPlan()
      await store.fetchPlan() // second call

      expect(planApi.getMyPlan).toHaveBeenCalledOnce()
    })

    it('handles API error gracefully', async () => {
      vi.mocked(planApi.getMyPlan).mockRejectedValue(new Error('Network error'))

      const store = usePlanStore()
      await store.fetchPlan()

      expect(store.error).toBe('Network error')
      expect(store.planInfo).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('does not overwrite planInfo on failed response', async () => {
      vi.mocked(planApi.getMyPlan).mockResolvedValue({
        success: false,
        message: 'Plan not found',
        data: null as any
      })

      const store = usePlanStore()
      store.planInfo = makePlanInfo() // pre-existing data
      await store.fetchPlan()

      // planInfo should remain since success was false
      expect(store.planInfo).not.toBeNull()
    })
  })

  // ── refreshPlan ───────────────────────────────────────────

  describe('refreshPlan', () => {
    it('bypasses cache and fetches fresh data', async () => {
      const info = makePlanInfo()
      vi.mocked(planApi.getMyPlan).mockResolvedValue({
        success: true,
        message: 'OK',
        data: info
      })

      const store = usePlanStore()
      await store.fetchPlan() // first fetch, sets cache
      await store.refreshPlan() // should bypass cache

      expect(planApi.getMyPlan).toHaveBeenCalledTimes(2)
    })
  })

  // ── restorePlan ───────────────────────────────────────────

  describe('restorePlan', () => {
    it('restores plan from localStorage', () => {
      const info = makePlanInfo()
      localStorage.setItem('plan_info', JSON.stringify(info))

      const store = usePlanStore()
      store.restorePlan()

      expect(store.planInfo).toEqual(info)
    })

    it('does nothing when localStorage is empty', () => {
      const store = usePlanStore()
      store.restorePlan()
      expect(store.planInfo).toBeNull()
    })

    it('clears corrupted localStorage data', () => {
      localStorage.setItem('plan_info', '{invalid json}}}')

      const store = usePlanStore()
      store.restorePlan()

      expect(store.planInfo).toBeNull()
      expect(localStorage.getItem('plan_info')).toBeNull()
    })
  })

  // ── clearPlan ─────────────────────────────────────────────

  describe('clearPlan', () => {
    it('clears all plan state and localStorage', () => {
      const store = usePlanStore()
      store.planInfo = makePlanInfo()
      localStorage.setItem('plan_info', '{}')

      store.clearPlan()

      expect(store.planInfo).toBeNull()
      expect(store.error).toBeNull()
      expect(localStorage.getItem('plan_info')).toBeNull()
    })
  })

  // ── Upgrade Modal ─────────────────────────────────────────

  describe('upgrade modal', () => {
    it('shows modal with module info', () => {
      const store = usePlanStore()
      const mod: PlanModule = {
        code: 'mod_reportes_ventas',
        name: 'Reportes',
        group: 'Ventas',
        enabled: false,
        minimum_plan: 'Medium'
      }

      store.showUpgradeModal(mod)

      expect(store.upgradeModalVisible).toBe(true)
      expect(store.upgradeModalModule).toEqual(mod)
    })

    it('shows modal with null module', () => {
      const store = usePlanStore()
      store.showUpgradeModal(null)

      expect(store.upgradeModalVisible).toBe(true)
      expect(store.upgradeModalModule).toBeNull()
    })

    it('hides modal and clears module', () => {
      const store = usePlanStore()
      store.showUpgradeModal({
        code: 'mod_blog', name: 'Blog', group: 'Contenido', enabled: false, minimum_plan: 'Small'
      })
      store.hideUpgradeModal()

      expect(store.upgradeModalVisible).toBe(false)
      expect(store.upgradeModalModule).toBeNull()
    })
  })
})
