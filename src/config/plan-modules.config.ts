/**
 * Mapping of module codes (modulo_nombrecodigo from DB) to frontend route prefixes.
 * Used by the plan store to determine if a route is accessible based on the store's plan.
 *
 * Routes not listed here are ALWAYS accessible (no plan gating).
 * A route matches if it starts with any of the listed prefixes for a module.
 */
export const MODULE_ROUTE_MAP: Record<string, string[]> = {
  // Sales
  mod_ventas: ['/orders'],
  mod_opiniones: ['/reviews'],
  mod_reclamaciones: ['/complaints'],

  // Reports
  mod_reportes_ventas: ['/reports'],

  // Catalog (specific routes MUST come before generic /products)
  mod_carga_productos_lote: ['/products/bulk-import'],
  mod_precios_producto: ['/products/prices'],
  mod_stock_producto: ['/products/stock'],
  mod_orden_producto: ['/products/order'],
  mod_productos: ['/products'],
  mod_categorias: ['/catalog/categories'],
  mod_marcas: ['/catalog/brands'],
  mod_gammas: ['/catalog/gammas'],
  mod_listas_productos: ['/catalog/product-lists'],
  mod_atributos: ['/catalog/attributes'],
  mod_etiquetas: ['/catalog/product-tags'],

  // Marketing
  mod_promociones: ['/marketing/promotions', '/marketing/promotions-v2'],
  mod_upsales: ['/marketing/upsales'],
  mod_combos: ['/marketing/combos'],
  mod_barras_anuncios: ['/marketing/announcement-bars'],
  mod_referidos: ['/marketing/referrals'],
  mod_fidelizacion: ['/marketing/loyalty'],
  mod_carrito_abandonado: ['/marketing/abandoned-carts'],

  // Content
  mod_paginas: ['/pages'],
  mod_blog: ['/blog'],
  mod_terminos: ['/legal'],
  mod_carrusel: ['/content/carousel'],
  mod_imagenes: ['/content/images'],
  mod_plantillas: ['/content/components'],

  // Appearance
  mod_apariencia: ['/appearance'],
  mod_menu: ['/appearance/menu'],

  // Billing
  mod_facturacion_electronica: ['/billing'],

  // Dispatch
  mod_panel_despacho: ['/dispatch'],

  // Shipping
  mod_tarifas_envio: ['/shipping'],

  // Store settings
  mod_varios_usuarios: ['/store/users'],
  mod_informacion: ['/store/info'],
  mod_dominio_propio: ['/store/domain'],
  mod_seo: ['/store/seo'],
  mod_tienda_facebook: ['/store/facebook'],
  mod_tiktok: ['/store/tiktok'],
  mod_preferencias: ['/store/config', '/notifications'],
  mod_formas_pago: ['/payment-gateways'],

  // Integrations
  mod_integraciones: ['/integrations'],
  mod_netsuite: ['/configuracion/netsuite'],

  // API
  mod_api: ['/api']
}

/**
 * Routes that are ALWAYS accessible regardless of plan.
 * These are core features that every store needs.
 */
export const ALWAYS_ACCESSIBLE_ROUTES = [
  '/dashboard',
  '/customers',
  '/store/addresses',
  '/store/subscription',
  '/profile',
  '/store-selection'
]
