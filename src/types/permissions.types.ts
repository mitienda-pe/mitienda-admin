export interface UserPermissions {
  /**
   * La tienda activó los permisos por usuario. Con `false` no se filtra nada:
   * es el comportamiento histórico y el default de todas las tiendas.
   */
  enforced: boolean
  /** Dueño de la tienda (usuariotipo_id = 1): siempre ve todo. */
  is_owner: boolean
  /**
   * Códigos de módulo concedidos. Viene vacío para el dueño, que tiene todo
   * por definición y no está representado en `usuariosmodulos`.
   */
  modules: string[]
}
