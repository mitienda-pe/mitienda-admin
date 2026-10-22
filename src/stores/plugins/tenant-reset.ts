import type { Pinia, PiniaPluginContext } from 'pinia'

/**
 * Vuelve todos los stores al estado inicial al cambiar de tienda.
 *
 * Cambiar de tienda (selectStore, impersonar, salir de impersonar) no recarga
 * la página: Pinia conserva lo que cada store cargó para la tienda anterior.
 * Los stores que cargan una sola vez (`if (!store.isLoaded) fetch()`) mostraban
 * así la configuración de OTRA tienda, y al guardar la escribían sobre la
 * actual. Limpiar store por store en cada camino de cambio se olvidaba de
 * alguno (pasó con shipping-config), así que se resetean todos.
 *
 * Quedan fuera los que no dependen de la tienda: la sesión y el superadmin.
 */
const NO_TENANT = new Set(['auth', 'admin', 'profile'])

// La foto se toma en JSON: ningún store arranca con Set/Map/Date. Las claves se
// guardan aparte porque JSON descarta las que valen `undefined`.
const initialStates = new Map<string, { keys: string[]; json: string }>()

export function tenantResetPlugin({ store }: PiniaPluginContext) {
  if (NO_TENANT.has(store.$id) || initialStates.has(store.$id)) return
  initialStates.set(store.$id, {
    keys: Object.keys(store.$state),
    json: JSON.stringify(store.$state)
  })
}

export function resetTenantStores(pinia: Pinia) {
  // `_s` es el registro interno de stores ya instanciados; los que todavía no
  // se usaron arrancarán limpios por sí solos.
  const stores = (pinia as unknown as { _s: Map<string, any> })._s
  stores.forEach((store, id) => {
    const initial = initialStates.get(id)
    if (!initial) return
    const fresh = JSON.parse(initial.json)
    store.$patch((state: Record<string, unknown>) => {
      for (const key of initial.keys) state[key] = fresh[key]
    })
  })
}
