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
}
