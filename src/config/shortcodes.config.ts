// Catálogo de shortcodes disponibles. Cada entrada debe tener un widget
// equivalente registrado en el storefront (PageContentRenderer.vue); si se
// agrega uno acá sin su widget, el merchant verá el texto `[…]` tal cual.
//
// Cada shortcode declara sus `fields`; ShortcodeInsertDialog los renderiza según
// `type` (text/number/product/category/brand/select) y serializa
// `[valor key="v" ...]`. Convención de valores: producto → id numérico;
// categoría/marca → slug (así lo espera el storefront).

export type ShortcodeFieldType = 'text' | 'number' | 'product' | 'category' | 'brand' | 'select'

export interface ShortcodeField {
  key: string
  label: string
  type: ShortcodeFieldType
  placeholder?: string
  help?: string
  required?: boolean
  options?: { label: string; value: string }[]
}

export type ShortcodeGroup = 'Catálogo' | 'Widgets externos' | 'Add-ons'

export interface ShortcodeType {
  value: string
  label: string
  group: ShortcodeGroup
  help?: string
  fields: ShortcodeField[]
}

const ORDEN_OPTIONS = [
  { label: 'Más recientes', value: 'recientes' },
  { label: 'Más populares', value: 'populares' },
  { label: 'Precio: menor a mayor', value: 'precio_asc' },
  { label: 'Precio: mayor a menor', value: 'precio_desc' },
  { label: 'Nombre: A-Z', value: 'nombre_asc' },
  { label: 'Nombre: Z-A', value: 'nombre_desc' },
]

export const SHORTCODE_GROUPS: ShortcodeGroup[] = ['Catálogo', 'Widgets externos', 'Add-ons']

export const SHORTCODE_TYPES: ShortcodeType[] = [
  {
    value: 'producto',
    label: 'Producto (viñeta)',
    group: 'Catálogo',
    help: 'Muestra la tarjeta de un producto con su precio y botón de compra.',
    fields: [{ key: 'id', label: 'Producto', type: 'product', required: true }],
  },
  {
    value: 'agregar_carrito',
    label: 'Botón "Agregar al carrito"',
    group: 'Catálogo',
    help: 'Botón que agrega un producto puntual al carrito.',
    fields: [{ key: 'id', label: 'Producto', type: 'product', required: true }],
  },
  {
    value: 'productos',
    label: 'Lista de productos',
    group: 'Catálogo',
    help: 'Grilla de productos. Filtra por categoría y/o marca (opcional).',
    fields: [
      { key: 'categoria', label: 'Categoría (opcional)', type: 'category' },
      { key: 'marca', label: 'Marca (opcional)', type: 'brand' },
      { key: 'limite', label: 'Cantidad a mostrar', type: 'number', placeholder: '8' },
      { key: 'orden', label: 'Orden (opcional)', type: 'select', options: ORDEN_OPTIONS },
      { key: 'titulo', label: 'Título (opcional)', type: 'text', placeholder: 'Nuestros productos' },
    ],
  },
  {
    value: 'categorias',
    label: 'Lista de categorías',
    group: 'Catálogo',
    fields: [{ key: 'titulo', label: 'Título (opcional)', type: 'text', placeholder: 'Categorías' }],
  },
  {
    value: 'marcas',
    label: 'Lista de marcas',
    group: 'Catálogo',
    fields: [{ key: 'titulo', label: 'Título (opcional)', type: 'text', placeholder: 'Marcas' }],
  },
  {
    value: 'storemapper',
    label: 'Storemapper (mapa de tiendas)',
    group: 'Widgets externos',
    help: 'El ID lo encuentras en tu panel de Storemapper.',
    fields: [{ key: 'id', label: 'ID de Storemapper', type: 'text', placeholder: '29720-Bfq2LEYgpPsVNnZ9', required: true }],
  },
  {
    value: 'storepoint',
    label: 'Storepoint (mapa de tiendas)',
    group: 'Widgets externos',
    help: "El ID está en el embed: new StorepointWidget('ESTE_ID', ...).",
    fields: [{ key: 'id', label: 'Widget ID de Storepoint', type: 'text', placeholder: '1690e3dbcdc582', required: true }],
  },
  {
    value: 'elfsight',
    label: 'Elfsight (widget)',
    group: 'Widgets externos',
    help: 'Sirve para cualquier app de Elfsight. En el código que te da Elfsight, el ID es lo que sigue a "elfsight-app-" en <div class="elfsight-app-XXXX">.',
    fields: [
      {
        key: 'id',
        label: 'ID del widget',
        type: 'text',
        placeholder: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
        required: true,
      },
    ],
  },
  {
    value: 'embedsocial',
    label: 'EmbedSocial (widget)',
    group: 'Widgets externos',
    help: 'Sirve para cualquier widget de EmbedSocial. En el código que te dan, es el valor de data-ref en <div class="embedsocial-hashtag" data-ref="XXXX">.',
    fields: [
      {
        key: 'ref',
        label: 'Referencia (data-ref)',
        type: 'text',
        placeholder: 'f718fc77f3f7142d374023362f2fd1f2aa471605',
        required: true,
      },
    ],
  },
  {
    value: 'senja',
    label: 'Senja (testimonios)',
    group: 'Widgets externos',
    help: 'En el código que te da Senja, el ID es el valor de data-id en <div class="senja-embed" data-id="XXXX">.',
    fields: [
      {
        key: 'id',
        label: 'ID del widget (data-id)',
        type: 'text',
        placeholder: '8a7964e2-7347-402f-b022-e5f03bf293c2',
        required: true,
      },
    ],
  },
  {
    value: 'review_widget',
    label: 'Reseñas de Google (review-widget.net)',
    group: 'Widgets externos',
    help: 'Pegar el código de review-widget.net no funciona: la tienda no ejecuta scripts externos. Copia de ese código los valores data-uuid y data-template.',
    fields: [
      { key: 'uuid', label: 'UUID (data-uuid)', type: 'text', placeholder: 'c2587b01-8059-4fca-91c5-4a604419a1c2', required: true },
      { key: 'template', label: 'Plantilla (data-template)', type: 'number', placeholder: '2', required: true },
      {
        key: 'lang',
        label: 'Idioma',
        type: 'select',
        options: [
          { label: 'Español', value: 'es' },
          { label: 'Inglés', value: 'en' },
        ],
      },
      {
        key: 'theme',
        label: 'Tema',
        type: 'select',
        options: [
          { label: 'Claro', value: 'light' },
          { label: 'Oscuro', value: 'dark' },
        ],
      },
    ],
  },
  {
    value: 'ar',
    label: 'Visor 3D / Realidad Aumentada',
    group: 'Add-ons',
    help: 'Genera un modelo 3D a partir de la foto. En la descripción de un producto se escribe [ar] a secas; acá hay que indicar la foto y las medidas.',
    fields: [
      { key: 'imagen', label: 'URL de la foto', type: 'text', placeholder: 'https://…/silla.jpg', help: 'Debe ser pública y mostrar un solo objeto sobre fondo limpio.', required: true },
      { key: 'ancho', label: 'Ancho (cm)', type: 'number', placeholder: '60' },
      { key: 'alto', label: 'Alto (cm)', type: 'number', placeholder: '90' },
      { key: 'profundidad', label: 'Profundidad (cm)', type: 'number', placeholder: '60' },
      {
        key: 'tipo',
        label: 'Categoría',
        type: 'select',
        help: 'Define cómo se apoya el objeto en AR.',
        options: [
          { label: 'Silla', value: 'chair' },
          { label: 'Sofá', value: 'sofa' },
          { label: 'Lámpara', value: 'lamp' },
          { label: 'Mesa', value: 'table' },
          { label: 'Otro', value: 'other' },
        ],
      },
    ],
  },
]
