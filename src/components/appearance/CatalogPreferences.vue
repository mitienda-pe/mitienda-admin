<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import { AppButton } from '@/components/ui'
import { productListApi } from '@/api/product-list.api'
import type { ProductList } from '@/types/product-list.types'
import {
  DESKTOP_COLUMN_OPTIONS,
  MOBILE_COLUMN_OPTIONS,
  LOGO_POSITION_OPTIONS,
  LAYOUT_WIDTH_OPTIONS,
  PDP_LAYOUT_OPTIONS,
  PDP_DESCRIPTION_OPTIONS,
  PDP_GALLERY_OPTIONS,
  PDP_RECOMMENDED_COUNT_OPTIONS,
  PDP_RECOMMENDED_SOURCE_OPTIONS,
  PDP_RECOMMENDED_SOURCE,
  CART_ICON_OPTIONS,
  PRODUCT_ORDER_OPTIONS,
  PRICING_MODE_OPTIONS,
} from '@/types/appearance.types'
import type { CatalogPreferences } from '@/types/appearance.types'

interface Props {
  preferences: CatalogPreferences
  isSaving: boolean
  hasChanges: boolean
  showCartIcon?: boolean
  showProductOrder?: boolean
  showHideOutOfStock?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCartIcon: true,
  showProductOrder: true,
  showHideOutOfStock: true,
})

const emit = defineEmits<{
  'update:field': [field: keyof CatalogPreferences, value: number | null]
  save: []
}>()

// No toda combinación se puede honrar, así que en vez de warnings sueltos se
// describe el resultado real. Dos casos degradan a "no se fija nada":
//  - lo fijo comparte columna con la descripción → la taparía;
//  - fotos fijas + galería apilada → la galería mide más que la pantalla.
const pdpSummary = computed(() => {
  const { pdp_layout: sticky, pdp_description: desc, pdp_gallery: gallery } = props.preferences
  const descText = desc === 1 ? 'la descripción va bajo la info' : 'la descripción va bajo las fotos'

  // La info vive en la columna derecha y las fotos en la izquierda: si lo fijo
  // y la descripción caen en la misma, la descripción le pasaría por debajo.
  if ((sticky === 0 && desc === 1) || (sticky === 1 && desc === 0)) {
    return { text: `Resultado: no se fija nada, porque ${descText}, en esa misma columna.`, muted: true }
  }
  if (sticky === 1 && gallery === 1) {
    return {
      text: `Resultado: no se fija nada, porque la galería apilada es más alta que la pantalla. ${
        descText.charAt(0).toUpperCase() + descText.slice(1)
      }.`,
      muted: true,
    }
  }
  if (sticky === 2) {
    return { text: `Resultado: las dos columnas hacen scroll y ${descText}.`, muted: false }
  }
  const stickyText = sticky === 1 ? 'las fotos acompañan el scroll' : 'la info acompaña el scroll'
  return { text: `Resultado: ${stickyText} y ${descText}.`, muted: false }
})

// Las listas de productos se cargan acá y no vía props porque este componente
// lo montan dos vistas distintas (Apariencia y Configuracion del catalogo) y
// pasarlas desde ambas duplicaria el fetch y el estado por una lectura chica.
const productLists = ref<ProductList[]>([])
const productListsLoaded = ref(false)

onMounted(async () => {
  try {
    const response = await productListApi.getAll()
    if (response.success && response.data) {
      productLists.value = response.data.filter((list) => list.productolista_estado === 1)
    }
  } catch {
    // Sin listas el selector queda vacío y se avisa en la UI; no vale la pena
    // romper toda la pantalla de apariencia por esto.
  } finally {
    productListsLoaded.value = true
  }
})

const productListOptions = computed(() =>
  productLists.value.map((list) => ({
    value: list.productolista_id,
    label: list.product_count
      ? `${list.productolista_nombre} (${list.product_count} productos)`
      : list.productolista_nombre,
  }))
)

const recommendedEnabled = computed(() => props.preferences.pdp_recommended_count > 0)
const recommendedUsesList = computed(
  () => props.preferences.pdp_recommended_source === PDP_RECOMMENDED_SOURCE.LIST
)

// Con una fuente estricta el bloque puede quedar vacío (y ocultarse) si el
// producto no tiene esa clasificacion. Se dice acá porque desde el panel no se
// ve, y en el storefront ya no hay a quien avisarle.
const recommendedNote = computed(() => {
  if (!recommendedEnabled.value) {
    return 'El bloque "También te puede interesar" no se muestra en ninguna ficha.'
  }
  switch (props.preferences.pdp_recommended_source) {
    case PDP_RECOMMENDED_SOURCE.CATEGORY:
      return 'En productos sin categoría el bloque se oculta, en vez de mostrar productos sin relación.'
    case PDP_RECOMMENDED_SOURCE.BRAND:
      return 'En productos sin marca el bloque se oculta, en vez de mostrar productos sin relación.'
    case PDP_RECOMMENDED_SOURCE.GAMMA:
      return 'En productos sin gama el bloque se oculta, en vez de mostrar productos sin relación.'
    case PDP_RECOMMENDED_SOURCE.LIST:
      return 'Todas las fichas muestran los mismos productos de la lista elegida.'
    default:
      return 'Mezcla categoría, marca, precio parecido y lo que suelen comprar junto. Si el producto no tiene con qué comparar, cae a los últimos publicados.'
  }
})

function onRecommendedSourceChange(value: number) {
  emit('update:field', 'pdp_recommended_source', value)
  // Salir de "lista fija" deja el id colgando y el backend lo rechazaría al
  // validar; se limpia acá para que el guardado no dependa del orden de clics.
  if (value !== PDP_RECOMMENDED_SOURCE.LIST && props.preferences.pdp_recommended_list_id !== null) {
    emit('update:field', 'pdp_recommended_list_id', null)
  }
}

const hideOutOfStockBool = computed({
  get: () => props.preferences.hide_out_of_stock === 1,
  set: (val: boolean) => emit('update:field', 'hide_out_of_stock', val ? 1 : 0),
})
</script>

<template>
  <div class="space-y-6">
    <!-- Desktop Columns -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Columnas en escritorio
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Cantidad de productos por fila en pantallas grandes
      </p>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="option in DESKTOP_COLUMN_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.desktop_columns === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'desktop_columns', option.value)"
        >
          <!-- Visual grid representation -->
          <div class="flex gap-1 justify-center mb-2">
            <div
              v-for="n in option.value"
              :key="n"
              class="h-8 rounded-sm"
              :class="
                preferences.desktop_columns === option.value
                  ? 'bg-primary/30'
                  : 'bg-gray-200'
              "
              :style="{ width: `${Math.floor(60 / option.value)}px` }"
            />
          </div>
          <span
            class="text-sm font-medium"
            :class="
              preferences.desktop_columns === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </span>
          <i
            v-if="preferences.desktop_columns === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Mobile Columns -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Columnas en móvil
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Cantidad de productos por fila en celulares
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in MOBILE_COLUMN_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.mobile_columns === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'mobile_columns', option.value)"
        >
          <!-- Visual grid with phone-like representation -->
          <div class="flex gap-1 justify-center mb-2">
            <div
              v-for="n in option.value"
              :key="n"
              class="h-10 rounded-sm"
              :class="
                preferences.mobile_columns === option.value
                  ? 'bg-primary/30'
                  : 'bg-gray-200'
              "
              :style="{ width: option.value === 1 ? '48px' : '28px' }"
            />
          </div>
          <span
            class="text-sm font-medium"
            :class="
              preferences.mobile_columns === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </span>
          <i
            v-if="preferences.mobile_columns === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Logo Position -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Posición del logo
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define la ubicación del logo en el encabezado de tu tienda
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in LOGO_POSITION_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.logo_position === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'logo_position', option.value)"
        >
          <i
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color:
                preferences.logo_position === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.logo_position === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <i
            v-if="preferences.logo_position === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Layout Width -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Ancho del catálogo
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define el ancho máximo del contenido en pantallas extra grandes
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in LAYOUT_WIDTH_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.layout_width === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'layout_width', option.value)"
        >
          <i
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color:
                preferences.layout_width === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.layout_width === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.layout_width === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Ficha de producto: qué se queda fijo -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Ficha de producto: qué se queda fijo
      </label>
      <p class="text-xs text-gray-400 mb-3">
        En escritorio, qué columna acompaña el scroll. En móvil no cambia nada.
      </p>
      <div class="grid grid-cols-3 gap-3 max-w-md">
        <button
          v-for="option in PDP_LAYOUT_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.pdp_layout === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'pdp_layout', option.value)"
        >
          <i
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color: preferences.pdp_layout === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.pdp_layout === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.pdp_layout === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Ficha de producto: dónde va la descripción -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Ficha de producto: dónde va la descripción
      </label>
      <p class="text-xs text-gray-400 mb-3">
        En escritorio, en qué columna cae la descripción del producto
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in PDP_DESCRIPTION_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.pdp_description === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'pdp_description', option.value)"
        >
          <i
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color: preferences.pdp_description === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.pdp_description === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.pdp_description === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
      <p class="text-xs mt-3" :class="pdpSummary.muted ? 'text-amber-600' : 'text-gray-500'">
        {{ pdpSummary.text }}
      </p>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Galería de la ficha -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Galería de la ficha
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Cómo se muestran las fotos del producto
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in PDP_GALLERY_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.pdp_gallery === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'pdp_gallery', option.value)"
        >
          <i
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color: preferences.pdp_gallery === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.pdp_gallery === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.pdp_gallery === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Productos recomendados en la ficha -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Productos recomendados en la ficha
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Cuántos productos muestra el bloque «También te puede interesar»
      </p>
      <div class="grid grid-cols-5 gap-2 max-w-lg">
        <button
          v-for="option in PDP_RECOMMENDED_COUNT_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-3 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.pdp_recommended_count === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'pdp_recommended_count', option.value)"
        >
          <div
            class="text-sm font-medium"
            :class="
              preferences.pdp_recommended_count === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
        </button>
      </div>

      <!-- De dónde salen -->
      <div v-if="recommendedEnabled" class="mt-5">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          De dónde salen
        </label>
        <p class="text-xs text-gray-400 mb-3">
          Qué relación tienen con el producto que se está viendo
        </p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            v-for="option in PDP_RECOMMENDED_SOURCE_OPTIONS"
            :key="option.value"
            type="button"
            class="relative p-4 border-2 rounded-lg text-left transition-all cursor-pointer"
            :class="
              preferences.pdp_recommended_source === option.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-gray-200 bg-white hover:border-gray-300'
            "
            @click="onRecommendedSourceChange(option.value)"
          >
            <i
              :class="option.icon"
              class="text-xl mb-2 block"
              :style="{
                color: preferences.pdp_recommended_source === option.value ? '#00b2a6' : '#6B7280',
              }"
            />
            <div
              class="text-sm font-medium"
              :class="
                preferences.pdp_recommended_source === option.value
                  ? 'text-primary'
                  : 'text-gray-600'
              "
            >
              {{ option.label }}
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
            <i
              v-if="preferences.pdp_recommended_source === option.value"
              class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
            />
          </button>
        </div>
      </div>

      <!-- Lista fija -->
      <div v-if="recommendedEnabled && recommendedUsesList" class="mt-4 max-w-md">
        <label for="pdp-recommended-list" class="block text-sm font-medium text-gray-700 mb-1">
          Lista de productos
        </label>
        <Dropdown
          id="pdp-recommended-list"
          :modelValue="preferences.pdp_recommended_list_id"
          :options="productListOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Elegí una lista"
          class="w-full"
          :loading="!productListsLoaded"
          @update:modelValue="emit('update:field', 'pdp_recommended_list_id', $event)"
        />
        <p
          v-if="productListsLoaded && productListOptions.length === 0"
          class="text-xs text-amber-600 mt-2"
        >
          Todavía no tenés listas de productos activas. Creá una en Catálogo → Listas de productos.
        </p>
      </div>

      <p class="text-xs mt-3" :class="recommendedEnabled ? 'text-gray-500' : 'text-gray-400'">
        {{ recommendedNote }}
      </p>
      <p v-if="recommendedEnabled" class="text-xs text-gray-400 mt-1">
        Cualquier producto puede tener sus propios recomendados, elegidos a mano desde su ficha:
        eso manda por encima de esta configuración.
      </p>
    </div>

    <!-- Divider -->
    <hr v-if="props.showCartIcon" class="border-gray-100" />

    <!-- Cart Icon -->
    <div v-if="props.showCartIcon">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Icono del carrito
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Elige el estilo de icono para el carrito de compras
      </p>
      <div class="grid grid-cols-3 gap-3 max-w-md">
        <button
          v-for="option in CART_ICON_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.cart_icon === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'cart_icon', option.value)"
        >
          <!-- Cart icon -->
          <i
            v-if="option.icon !== 'basket'"
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color:
                preferences.cart_icon === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <!-- Basket SVG (Lucide shopping-basket) -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-7 h-7 mx-auto mb-2"
            :style="{
              color:
                preferences.cart_icon === option.value ? '#00b2a6' : '#6B7280',
            }"
          >
            <path d="m15 11-1 9" />
            <path d="m19 11-4-7" />
            <path d="M2 11h20" />
            <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
            <path d="M4.5 15.5h15" />
            <path d="m5 11 4-7" />
            <path d="m9 11 1 9" />
          </svg>
          <div
            class="text-sm font-medium"
            :class="
              preferences.cart_icon === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <i
            v-if="preferences.cart_icon === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr v-if="props.showProductOrder" class="border-gray-100" />

    <!-- Product Order -->
    <div v-if="props.showProductOrder">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Orden de los productos
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define el orden por defecto de los productos en tu catalogo
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="option in PRODUCT_ORDER_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.product_order === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'product_order', option.value)"
        >
          <i
            :class="option.icon"
            class="text-xl mb-2 block"
            :style="{
              color:
                preferences.product_order === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.product_order === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.product_order === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr v-if="props.showHideOutOfStock" class="border-gray-100" />

    <!-- Hide Out-of-Stock -->
    <div v-if="props.showHideOutOfStock">
      <div class="flex items-center justify-between">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Ocultar productos agotados
          </label>
          <p class="text-xs text-gray-400 mt-0.5">
            Los productos sin stock no se mostraran en el catalogo
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="
              hideOutOfStockBool
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            "
          >
            {{ hideOutOfStockBool ? 'Ocultos' : 'Visibles' }}
          </span>
          <InputSwitch v-model="hideOutOfStockBool" />
        </div>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Pricing Mode -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Modo de precios
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define cual precio ingresas normalmente. El otro se calculara automaticamente.
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-md">
        <button
          v-for="option in PRICING_MODE_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.pricing_mode === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'pricing_mode', option.value)"
        >
          <i
            :class="option.icon"
            class="text-xl mb-2 block"
            :style="{
              color:
                preferences.pricing_mode === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.pricing_mode === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.pricing_mode === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Save button -->
    <div class="flex items-center gap-3 pt-2">
      <AppButton
        variant="primary"
        :loading="isSaving"
        :disabled="!hasChanges"
        @click="emit('save')"
      >
        <i class="pi pi-check mr-2" />
        Guardar preferencias
      </AppButton>
      <span v-if="hasChanges" class="text-xs text-amber-600">
        Tienes cambios sin guardar
      </span>
    </div>
  </div>
</template>
