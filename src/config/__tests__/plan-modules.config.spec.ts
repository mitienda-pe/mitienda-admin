import { describe, it, expect } from 'vitest'
import { MODULE_ROUTE_MAP, ALWAYS_ACCESSIBLE_ROUTES } from '@/config/plan-modules.config'

describe('plan-modules.config', () => {
  describe('MODULE_ROUTE_MAP', () => {
    it('maps all expected module codes', () => {
      const moduleCodes = Object.keys(MODULE_ROUTE_MAP)

      // Catalog modules
      expect(moduleCodes).toContain('mod_productos')
      expect(moduleCodes).toContain('mod_categorias')
      expect(moduleCodes).toContain('mod_marcas')
      expect(moduleCodes).toContain('mod_gammas')
      expect(moduleCodes).toContain('mod_listas_productos')
      expect(moduleCodes).toContain('mod_atributos')
      expect(moduleCodes).toContain('mod_etiquetas')

      // Marketing
      expect(moduleCodes).toContain('mod_promociones')
      expect(moduleCodes).toContain('mod_upsales')
      expect(moduleCodes).toContain('mod_combos')
      expect(moduleCodes).toContain('mod_barras_anuncios')
      expect(moduleCodes).toContain('mod_referidos')
      expect(moduleCodes).toContain('mod_carrito_abandonado')

      // Content
      expect(moduleCodes).toContain('mod_paginas')
      expect(moduleCodes).toContain('mod_blog')
      expect(moduleCodes).toContain('mod_carrusel')
      expect(moduleCodes).toContain('mod_imagenes')

      // Reports
      expect(moduleCodes).toContain('mod_reportes_ventas')
    })

    it('every module maps to at least one route prefix', () => {
      for (const [code, routes] of Object.entries(MODULE_ROUTE_MAP)) {
        expect(routes.length, `${code} should have at least one route`).toBeGreaterThan(0)
      }
    })

    it('all route prefixes start with /', () => {
      for (const [code, routes] of Object.entries(MODULE_ROUTE_MAP)) {
        for (const route of routes) {
          expect(route, `${code}: route "${route}" should start with /`).toMatch(/^\//)
        }
      }
    })

    it('no duplicate route prefixes across modules', () => {
      const allRoutes: string[] = []
      const duplicates: string[] = []

      for (const routes of Object.values(MODULE_ROUTE_MAP)) {
        for (const route of routes) {
          if (allRoutes.includes(route)) {
            duplicates.push(route)
          }
          allRoutes.push(route)
        }
      }

      expect(duplicates, `Duplicate routes found: ${duplicates.join(', ')}`).toEqual([])
    })
  })

  describe('ALWAYS_ACCESSIBLE_ROUTES', () => {
    it('includes core routes', () => {
      expect(ALWAYS_ACCESSIBLE_ROUTES).toContain('/dashboard')
      expect(ALWAYS_ACCESSIBLE_ROUTES).toContain('/customers')
      expect(ALWAYS_ACCESSIBLE_ROUTES).toContain('/profile')
      expect(ALWAYS_ACCESSIBLE_ROUTES).toContain('/store-selection')
    })

    it('all routes start with /', () => {
      for (const route of ALWAYS_ACCESSIBLE_ROUTES) {
        expect(route, `Route "${route}" should start with /`).toMatch(/^\//)
      }
    })

    it('does not overlap with MODULE_ROUTE_MAP', () => {
      const moduleRoutes = Object.values(MODULE_ROUTE_MAP).flat()

      for (const accessibleRoute of ALWAYS_ACCESSIBLE_ROUTES) {
        const overlap = moduleRoutes.find(
          r => r.startsWith(accessibleRoute) || accessibleRoute.startsWith(r)
        )
        expect(
          overlap,
          `"${accessibleRoute}" overlaps with module route "${overlap}"`
        ).toBeUndefined()
      }
    })
  })
})
