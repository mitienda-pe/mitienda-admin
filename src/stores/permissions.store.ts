import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { permissionsApi } from '@/api/permissions.api'
import {
  moduleForRoute,
  routeMatchesPrefix,
  USER_ALWAYS_ACCESSIBLE_ROUTES
} from '@/config/user-permission-routes.config'

const STORAGE_KEY = 'user_permissions'

/**
 * Permisos de módulo POR USUARIO (`usuariosmodulos`).
 *
 * Capa distinta del `plan.store`: aquel decide qué contrató la TIENDA y muestra
 * un candado con invitación a subir de plan; este decide qué le concedió el
 * dueño a ESTE usuario y directamente esconde el ítem del menú.
 *
 * Es opt-in por tienda (`enforced`). Mientras la tienda no lo active, todo lo
 * de acá responde permisivo y el backoffice se comporta como siempre.
 *
 * Falla ABIERTO a propósito: si la llamada falla o todavía no cargó, no se
 * esconde nada. La restricción real la aplica la API (filtro `moduleaccess`);
 * esconder el menú es comodidad, no la barrera de seguridad.
 */
export const usePermissionsStore = defineStore('permissions', () => {
  const enforced = ref(false)
  /** Acceso total: propietario, administrador o superadmin impersonando. */
  const isOwner = ref(false)
  const moduleCodes = ref<string[]>([])
  const isLoaded = ref(false)
  const isLoading = ref(false)

  const grantedModules = computed(() => new Set(moduleCodes.value))

  /**
   * ¿Este usuario tiene concedido el módulo?
   */
  function hasModule(moduleCode: string): boolean {
    if (!enforced.value || !isLoaded.value) return true
    if (isOwner.value) return true
    return grantedModules.value.has(moduleCode)
  }

  /**
   * ¿Puede entrar a esta ruta? Las rutas no mapeadas a ningún módulo quedan
   * accesibles (mismo criterio fail-open que el gating por plan).
   */
  function canAccessRoute(routePath: string): boolean {
    if (!enforced.value || !isLoaded.value) return true
    if (isOwner.value) return true

    if (USER_ALWAYS_ACCESSIBLE_ROUTES.some(r => routeMatchesPrefix(routePath, r))) {
      return true
    }

    const code = moduleForRoute(routePath)
    if (!code) return true

    return grantedModules.value.has(code)
  }

  function apply(data: { enforced: boolean; is_owner: boolean; modules: string[] }) {
    enforced.value = data.enforced
    isOwner.value = data.is_owner
    moduleCodes.value = data.modules ?? []
    isLoaded.value = true
  }

  async function fetchPermissions() {
    isLoading.value = true
    try {
      const response = await permissionsApi.getMyPermissions()
      if (response.success && response.data) {
        apply(response.data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data))
      }
    } catch (e) {
      // Fail-open: sin datos no se esconde nada. Ver docblock del store.
      console.error('Error fetching user permissions:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Restaura de localStorage para que el primer render ya tenga el menú
   * correcto y no parpadee mientras vuelve la llamada.
   */
  function restorePermissions() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      apply(JSON.parse(saved))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /** Al cambiar de tienda o cerrar sesión: los permisos son por tienda. */
  function clearPermissions() {
    enforced.value = false
    isOwner.value = false
    moduleCodes.value = []
    isLoaded.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    enforced,
    isOwner,
    moduleCodes,
    isLoaded,
    isLoading,
    grantedModules,
    hasModule,
    canAccessRoute,
    fetchPermissions,
    restorePermissions,
    clearPermissions
  }
})
