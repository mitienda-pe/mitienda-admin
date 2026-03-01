export const HELP_DOCS_BASE_URL =
  'https://cdn.jsdelivr.net/gh/mitienda-pe/mitienda-docs@main'

/**
 * Ordered array of [routePrefix, docSlug] tuples.
 * First match wins — more specific prefixes must come before generic ones.
 */
export const routeToDocMap: [string, string][] = [
  // Dashboard
  ['/dashboard', '01-dashboard'],

  // Products (Catálogo > Productos)
  ['/products', '05-catalogo/01-productos'],

  // Orders (Ventas > Pedidos)
  ['/orders', '03-ventas/01-pedidos'],

  // Customers (Clientes)
  ['/customers', '02-clientes'],

  // Reviews (Ventas > Opiniones)
  ['/reviews', '03-ventas/02-reviews'],

  // Complaints (Ventas > Libro de Reclamaciones)
  ['/complaints', '03-ventas/03-libro-reclamaciones'],

  // Reports (Reportes)
  ['/reports', '04-reportes'],

  // Catalog
  ['/catalog/categories', '05-catalogo/02-categorias'],
  ['/catalog/brands', '05-catalogo/03-marcas'],
  ['/catalog/gammas', '05-catalogo/04-gammas'],
  ['/catalog/attributes', '05-catalogo/05-atributos'],
  ['/catalog/product-tags', '05-catalogo/06-etiquetas'],
  ['/catalog/product-lists', '05-catalogo/07-listas'],
  ['/catalog/config', '05-catalogo/08-config-catalogo'],

  // Marketing
  ['/marketing/promotions-v2', '06-marketing/02-promociones-avanzadas'],
  ['/marketing/promotions', '06-marketing/01-promociones'],
  ['/marketing/upsales', '06-marketing/03-upsales'],
  ['/marketing/combos', '06-marketing/04-combos'],
  ['/marketing/announcement-bars', '06-marketing/05-barras-anuncio'],
  ['/marketing/referrals', '06-marketing/06-referidos'],
  ['/marketing/abandoned-carts', '03-ventas/04-carritos-abandonados'],

  // Pages (Contenido > Páginas)
  ['/pages', '07-contenido/01-paginas'],

  // Blog (Contenido > Blog)
  ['/blog', '07-contenido/02-blog'],

  // Legal (Contenido > Páginas Legales)
  ['/legal', '07-contenido/03-paginas-legales'],

  // Content
  ['/content/carousel', '07-contenido/04-carrusel'],
  ['/content/images', '07-contenido/05-galeria'],
  ['/content/components', '07-contenido/06-componentes'],
  ['/content/messages', '07-contenido/07-mensajes'],

  // Appearance
  ['/appearance/config', '08-apariencia/01-general'],
  ['/appearance/colors', '08-apariencia/02-colores'],
  ['/appearance/typography', '08-apariencia/03-tipografia'],
  ['/appearance/product-card', '08-apariencia/04-tarjeta-producto'],
  ['/appearance/menu', '08-apariencia/05-menu'],

  // Payment Gateways
  ['/payment-gateways', '09-formas-pago'],

  // Shipping
  ['/shipping', '10-envios'],

  // Billing (Facturación)
  ['/billing', '11-facturacion'],

  // Store Settings (Configuración)
  ['/store/info', '12-configuracion/01-informacion'],
  ['/store/addresses', '12-configuracion/02-sucursales'],
  ['/store/config', '12-configuracion/03-config-general'],
  ['/store/domain', '12-configuracion/04-dominio'],
  ['/store/seo', '12-configuracion/05-seo'],
  ['/store/facebook', '12-configuracion/06-facebook-meta'],
  ['/store/tiktok', '12-configuracion/07-tiktok'],
  ['/store/users', '12-configuracion/08-usuarios-equipo'],
  ['/store/subscription', '12-configuracion/10-suscripcion'],

  // Notifications
  ['/notifications', '12-configuracion/09-notificaciones'],

  // Integrations
  ['/integrations', '13-integraciones'],
  ['/configuracion/netsuite', '14-netsuite'],
  ['/api', '15-api'],
]

export function getDocSlugForRoute(path: string): string {
  for (const [prefix, slug] of routeToDocMap) {
    if (path.startsWith(prefix)) return slug
  }
  return '00-introduccion'
}
