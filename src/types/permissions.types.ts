export interface UserPermissions {
  /**
   * La tienda activó los permisos por usuario. Con `false` no se filtra nada:
   * es el comportamiento histórico y el default de todas las tiendas.
   */
  enforced: boolean
  /**
   * Acceso total a los módulos del plan: propietario, administrador o superadmin
   * impersonando. El nombre viene de cuando el propietario era el único caso.
   */
  is_owner: boolean
  /**
   * Códigos de módulo concedidos. Viene vacío para el dueño, que tiene todo
   * por definición y no está representado en `usuariosmodulos`.
   */
  modules: string[]
  /**
   * Subconjunto de `modules` concedido en SOLO LECTURA: el usuario entra a la
   * pantalla pero no puede modificar nada. El bloqueo real lo aplica la API
   * (`WriteAccessGuard`); acá sirve para no mostrarle botones que van a fallar.
   *
   * Opcional porque una respuesta cacheada en localStorage de antes de esta
   * versión no lo trae; ausente equivale a "ninguno en solo lectura".
   */
  readonly_modules?: string[]
}
