import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionsStore } from '@/stores/permissions.store'

export interface UseReadOnly {
  /** El usuario puede ver esta pantalla pero no modificarla. */
  readOnly: ComputedRef<boolean>
  /** Inverso de `readOnly`, para leer mejor en los `:disabled`. */
  canEdit: ComputedRef<boolean>
}

/**
 * ¿Esta pantalla es de solo lectura para el usuario actual?
 *
 * Sin argumento resuelve el módulo desde la ruta, que es lo que quiere el 90%
 * de las vistas. Pasá `moduleCode` cuando la pantalla toca un módulo distinto
 * del que la gobierna — por ejemplo un diálogo de facturación abierto desde el
 * detalle de un pedido.
 *
 * Falla abierto: sin permisos cargados, sin enforcement o con el módulo sin
 * mapear, `readOnly` es false y la pantalla se comporta como siempre. La
 * barrera real es la API (`WriteAccessGuard`); esto evita ofrecer botones que
 * van a rebotar.
 */
export function useReadOnly(moduleCode?: string): UseReadOnly {
  const permissions = usePermissionsStore()
  const route = useRoute()

  const readOnly = computed(() =>
    moduleCode
      ? !permissions.canEdit(moduleCode)
      : !permissions.canEditRoute(route.path)
  )

  return {
    readOnly,
    canEdit: computed(() => !readOnly.value)
  }
}
