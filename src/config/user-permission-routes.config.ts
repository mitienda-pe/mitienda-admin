import { MODULE_ROUTE_MAP } from './plan-modules.config'

/**
 * Mapa código de módulo → rutas del backoffice, para los permisos POR USUARIO
 * (`usuariosmodulos`), que son una capa distinta del gating por plan.
 *
 * Parte de `MODULE_ROUTE_MAP` porque casi todo coincide, pero es un mapa aparte
 * a propósito:
 *
 *  - El gating por plan es por tienda y muestra un candado con invitación a
 *    subir de plan; este es por usuario y simplemente esconde el ítem.
 *  - Hay pantallas que ningún plan restringe pero que sí tiene sentido poder
 *    quitarle a un usuario invitado (Clientes es el caso claro), así que
 *    aparecen acá y no allá.
 *
 * Mantener alineado con `Config\BackofficeModules::$groups` en la API: si un
 * módulo se muestra como casilla en la pantalla de Usuarios, debería tener
 * ruta acá, o marcarlo no cambia nada.
 */
/**
 * `mod_analitica_web` está `modulo_publicado = 0` en la BD, así que nunca sale
 * en el catálogo de la pantalla de Usuarios y NADIE puede tenerlo concedido.
 * Dejarlo gateando `/reports/web-analytics` escondería Analítica Web a todo
 * usuario invitado sin que el dueño tenga forma de dársela. Al sacarlo, la ruta
 * cae bajo el prefijo `/reports` y hereda el permiso de Reportes.
 *
 * Si algún día se publica el módulo, quitar esta exclusión.
 */
const { mod_analitica_web: _unpublished, ...GRANTABLE_PLAN_ROUTES } = MODULE_ROUTE_MAP

/**
 * `mod_plugins` NO gatea `/plugins`, aunque el nombre lo sugiera: ese código es
 * del módulo "Avanzado" del panel legacy (el editor de HTML/scripts, ver
 * `administrador/Avanzado.php`), y el sistema de plugins lo reusó por accidente.
 * Mapearlo acá escondía el menú Plugins a todo invitado sin "Avanzado", pese a
 * que la tienda sí tuviera el plugin asignado.
 *
 * La visibilidad real de Plugins la da la asignación por tienda
 * (`store_plugin_assignments`, que concede el superadmin); no hay gating por
 * plan ni por usuario. Si algún día hace falta uno, va con un módulo propio, no
 * reusando el 10.
 */
export const USER_PERMISSION_ROUTE_MAP: Record<string, string[]> = {
  ...GRANTABLE_PLAN_ROUTES,

  // Pantallas sin gating de plan que sí se pueden restringir por usuario.
  mod_clientes: ['/customers'],
  mod_colores: ['/appearance/colors'],
  mod_tipografia: ['/appearance/typography'],
  mod_google: ['/store/google'],
  mod_formas_pago: ['/payment-gateways'],
  mod_pos: ['/pos'],
  mod_panel_despacho: ['/dispatch']
}

/**
 * Rutas accesibles para cualquier usuario de la tienda, tenga los módulos que
 * tenga. Sin esto un invitado con permisos acotados no podría ni aterrizar en
 * el dashboard ni cambiar de tienda después de entrar.
 */
export const USER_ALWAYS_ACCESSIBLE_ROUTES = [
  '/',
  '/dashboard',
  '/profile',
  '/my-stores',
  '/store-selection',
  '/store/subscription'
]

/**
 * Compara ruta contra prefijo con boundary de segmento: `/marketing/promotions-v2`
 * NO matchea el prefijo `/marketing/promotions`. Mismo criterio que el store de
 * plan; sin esto, rutas que comparten el principio se bloquean entre sí.
 */
export function routeMatchesPrefix(routePath: string, prefix: string): boolean {
  if (routePath === prefix) return true
  return routePath.startsWith(prefix + '/')
}

/**
 * Módulo que gobierna una ruta, eligiendo el prefijo MÁS LARGO que matchee.
 *
 * El store de plan usa "el primero que matchee", que depende del orden de las
 * claves del objeto. Acá no: `/appearance/colors` debe resolver a `mod_colores`
 * y no a `mod_apariencia` (`/appearance`) por haberse declarado antes.
 *
 * Devuelve null si la ruta no está mapeada — esas quedan siempre accesibles.
 */
export function moduleForRoute(routePath: string): string | null {
  let bestCode: string | null = null
  let bestLength = -1

  for (const [code, paths] of Object.entries(USER_PERMISSION_ROUTE_MAP)) {
    for (const prefix of paths) {
      if (routeMatchesPrefix(routePath, prefix) && prefix.length > bestLength) {
        bestCode = code
        bestLength = prefix.length
      }
    }
  }

  return bestCode
}
