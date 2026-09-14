import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePermissionsStore } from '@/stores/permissions.store'
import type { UserPermissions } from '@/types/permissions.types'

vi.mock('@/api/permissions.api', () => ({
  permissionsApi: {
    getMyPermissions: vi.fn()
  }
}))

/**
 * Nivel de acceso por módulo (ver vs. editar).
 *
 * Lo que se blinda acá es que el store falle ABIERTO en todos los caminos por
 * los que puede quedar sin datos: sin enforcement, sin cargar, para el dueño, o
 * con una respuesta vieja de localStorage que todavía no traía
 * `readonly_modules`. En todos, el usuario tiene que poder editar — si alguno
 * fallara cerrado, media plataforma se volvería de solo lectura en silencio.
 */
describe('permissions.store — solo lectura', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  /**
   * Siembra permisos por el mismo camino que usa el primer render: localStorage
   * + restorePermissions(). Así el test ejercita la ruta real y no un setter
   * que solo existe para los tests.
   */
  function apply(data: Partial<UserPermissions> = {}) {
    localStorage.setItem(
      'user_permissions',
      JSON.stringify({
        enforced: true,
        is_owner: false,
        modules: ['mod_ventas', 'mod_productos'],
        readonly_modules: ['mod_ventas'],
        ...data
      })
    )
    const store = usePermissionsStore()
    store.restorePermissions()
    return store
  }

  it('un módulo en solo lectura no se puede editar', () => {
    const store = apply()
    expect(store.canEdit('mod_ventas')).toBe(false)
    expect(store.canEdit('mod_productos')).toBe(true)
  })

  it('resuelve la ruta al módulo más específico', () => {
    const store = apply({
      modules: ['mod_apariencia', 'mod_colores'],
      readonly_modules: ['mod_colores']
    })
    // /appearance/colors responde por mod_colores, no por mod_apariencia.
    expect(store.canEditRoute('/appearance/colors')).toBe(false)
    expect(store.canEditRoute('/appearance')).toBe(true)
  })

  it('una ruta sin módulo mapeado queda editable', () => {
    const store = apply()
    expect(store.canEditRoute('/dashboard')).toBe(true)
  })

  it('el dueño edita todo aunque la tienda aplique permisos', () => {
    const store = apply({ is_owner: true, readonly_modules: ['mod_ventas'] })
    expect(store.canEdit('mod_ventas')).toBe(true)
  })

  it('sin enforcement no restringe nada', () => {
    const store = apply({ enforced: false })
    expect(store.canEdit('mod_ventas')).toBe(true)
  })

  it('sin permisos cargados no restringe nada', () => {
    const store = usePermissionsStore()
    expect(store.canEdit('mod_ventas')).toBe(true)
    expect(store.canEditRoute('/orders/123')).toBe(true)
  })

  it('una respuesta cacheada sin readonly_modules no vuelve todo de lectura', () => {
    // Es el caso del primer render tras desplegar: el localStorage guarda la
    // forma vieja de la respuesta.
    const store = usePermissionsStore()
    localStorage.setItem(
      'user_permissions',
      JSON.stringify({ enforced: true, is_owner: false, modules: ['mod_ventas'] })
    )
    store.restorePermissions()

    expect(store.canEdit('mod_ventas')).toBe(true)
  })

  it('cambiar de tienda limpia los niveles', () => {
    const store = apply()
    expect(store.canEdit('mod_ventas')).toBe(false)

    store.clearPermissions()
    expect(store.canEdit('mod_ventas')).toBe(true)
  })
})
