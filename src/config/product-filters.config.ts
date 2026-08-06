import type { PublishedFilter } from '@/types/product.types'

/**
 * Opciones del filtro por estado de publicación usado en los módulos de
 * gestión masiva Precios y Stock. Orden del Catálogo no lo usa: carga el
 * catálogo entero para reordenarlo y filtrarlo lo vuelve inusablemente lento.
 *
 * `''` = sin filtro: se listan publicados y no publicados. En los tres casos
 * los productos eliminados (producto_status = 0) quedan siempre fuera.
 */
export const publishedFilterOptions: Array<{
  label: string
  value: PublishedFilter
}> = [
  { label: 'Todos', value: '' },
  { label: 'Solo publicados', value: '1' },
  { label: 'Solo no publicados', value: '0' },
]
