<template>
  <Dialog
    :visible="visible"
    header="Insertar shortcode"
    :modal="true"
    :style="{ width: '520px' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-secondary-500">
        Los shortcodes insertan bloques dinámicos (productos, categorías,
        marcas, mapas, reseñas) que se renderizan en tu tienda al verla.
      </p>

      <!-- Tipo de shortcode -->
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de bloque</label>
        <Dropdown
          v-model="shortcodeType"
          :options="groupedShortcodes"
          option-label="label"
          option-value="value"
          option-group-label="label"
          option-group-children="items"
          class="w-full"
        />
        <p v-if="selectedShortcode?.help" class="text-xs text-secondary-400 mt-1">
          {{ selectedShortcode.help }}
        </p>
      </div>

      <!-- Campos dinámicos según el tipo -->
      <div v-for="field in selectedShortcode?.fields || []" :key="field.key">
        <label class="block text-sm font-medium text-secondary-700 mb-1">{{ field.label }}</label>

        <!-- Producto (búsqueda) -->
        <AutoComplete
          v-if="field.type === 'product'"
          v-model="productQuery"
          :suggestions="productResults"
          option-label="name"
          placeholder="Buscar producto por nombre..."
          class="w-full"
          dropdown
          force-selection
          @complete="searchProducts"
          @item-select="onProductSelect(field.key, $event)"
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2">
              <img
                v-if="option.images?.[0]"
                :src="option.images[0].thumbnail || option.images[0].url"
                class="w-8 h-8 object-cover rounded"
              />
              <span class="text-sm">{{ option.name }}</span>
            </div>
          </template>
        </AutoComplete>

        <!-- Categoría -->
        <Dropdown
          v-else-if="field.type === 'category'"
          v-model="shortcodeValues[field.key]"
          :options="catalogStore.flatCategories"
          option-label="name"
          option-value="slug"
          :loading="catalogStore.isCategoriesLoading"
          placeholder="Todas / elige una categoría"
          show-clear
          filter
          class="w-full"
        />

        <!-- Marca -->
        <Dropdown
          v-else-if="field.type === 'brand'"
          v-model="shortcodeValues[field.key]"
          :options="catalogStore.brands"
          option-label="name"
          option-value="slug"
          :loading="catalogStore.isBrandsLoading"
          placeholder="Todas / elige una marca"
          show-clear
          filter
          class="w-full"
        />

        <!-- Select -->
        <Dropdown
          v-else-if="field.type === 'select'"
          v-model="shortcodeValues[field.key]"
          :options="field.options || []"
          option-label="label"
          option-value="value"
          placeholder="Por defecto"
          show-clear
          class="w-full"
        />

        <!-- Número -->
        <InputText
          v-else-if="field.type === 'number'"
          v-model="shortcodeValues[field.key]"
          type="number"
          min="1"
          :placeholder="field.placeholder"
          class="w-full"
        />

        <!-- Texto -->
        <InputText
          v-else
          v-model="shortcodeValues[field.key]"
          :placeholder="field.placeholder"
          class="w-full"
        />

        <p v-if="field.help" class="text-xs text-secondary-400 mt-1">{{ field.help }}</p>
      </div>

      <!-- Preview -->
      <div v-if="isShortcodeValid">
        <label class="block text-sm font-medium text-secondary-700 mb-1">Se insertará</label>
        <code class="block text-sm bg-gray-100 text-secondary-700 rounded px-3 py-2 font-mono break-all">
          {{ generatedShortcode }}
        </code>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" text @click="emit('update:visible', false)" />
      <Button
        label="Insertar"
        icon="pi pi-bolt"
        :disabled="!isShortcodeValid"
        @click="handleInsert"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import AutoComplete from 'primevue/autocomplete'
import InputText from 'primevue/inputtext'
import { useCatalogStore } from '@/stores/catalog.store'
import { useStoreConfigStore } from '@/stores/store-config.store'
import { productsApi } from '@/api/products.api'
import { SHORTCODE_GROUPS, SHORTCODE_TYPES } from '@/config/shortcodes.config'
import type { Product } from '@/types/product.types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  insert: [shortcode: string]
}>()

const catalogStore = useCatalogStore()
const storeConfig = useStoreConfigStore()

const shortcodeType = ref<string>(SHORTCODE_TYPES[0].value)
// Valores por atributo del shortcode seleccionado (key → valor). Dropdown con
// show-clear puede escribir null; se normaliza a '' al serializar.
const shortcodeValues = reactive<Record<string, string | null>>({})
// Estado del picker de producto (AutoComplete). Hay a lo sumo un campo
// producto por shortcode, así que un solo estado alcanza.
const productQuery = ref<Product | string | null>(null)
const productResults = ref<Product[]>([])

// El visor 3D/AR es un add-on: sólo aparece en el selector si MiTienda lo activó
// para esta tienda (el proveedor licencia el widget por dominio).
const availableShortcodes = computed(() =>
  SHORTCODE_TYPES.filter(
    (s) => s.value !== 'ar' || storeConfig.savedConfig.tiendageneral_sw_ar_3d === 1
  )
)

const groupedShortcodes = computed(() =>
  SHORTCODE_GROUPS
    .map((group) => ({
      label: group,
      items: availableShortcodes.value.filter((s) => s.group === group),
    }))
    .filter((g) => g.items.length)
)

const selectedShortcode = computed(() =>
  SHORTCODE_TYPES.find((s) => s.value === shortcodeType.value)
)

const generatedShortcode = computed(() => {
  const sc = selectedShortcode.value
  if (!sc) return ''
  const attrs = sc.fields
    .map((f) => {
      // Las comillas cerrarían el atributo y el storefront no reconocería el shortcode.
      const v = (shortcodeValues[f.key] ?? '').toString().trim().replace(/"/g, '')
      return v ? `${f.key}="${v}"` : ''
    })
    .filter(Boolean)
  return attrs.length ? `[${sc.value} ${attrs.join(' ')}]` : `[${sc.value}]`
})

const isShortcodeValid = computed(() => {
  const sc = selectedShortcode.value
  if (!sc) return false
  return sc.fields
    .filter((f) => f.required)
    .every((f) => (shortcodeValues[f.key] ?? '').toString().trim() !== '')
})

function resetShortcodeValues() {
  Object.keys(shortcodeValues).forEach((k) => delete shortcodeValues[k])
  productQuery.value = null
  productResults.value = []
}

// Al abrir, arrancar de cero y cargar el catálogo para los dropdowns de
// categoría/marca (una sola vez).
watch(
  () => props.visible,
  (open) => {
    if (!open) return
    shortcodeType.value = SHORTCODE_TYPES[0].value
    resetShortcodeValues()
    if (!catalogStore.categories.length) catalogStore.fetchCategories()
    if (!catalogStore.brands.length) catalogStore.fetchBrands()
  }
)

// Al cambiar de tipo de shortcode, limpiar los valores del anterior.
watch(shortcodeType, () => resetShortcodeValues())

async function searchProducts(event: { query: string }) {
  if (event.query.length < 2) return
  try {
    const res = await productsApi.getProducts({ search: event.query, limit: 10 })
    productResults.value = res.data || []
  } catch {
    productResults.value = []
  }
}

function onProductSelect(fieldKey: string, event: { value: Product }) {
  shortcodeValues[fieldKey] = String(event.value?.id ?? '')
}

function handleInsert() {
  if (!isShortcodeValid.value) return
  emit('insert', generatedShortcode.value)
  emit('update:visible', false)
}

onMounted(() => {
  // Necesaria para saber si la tienda tiene el add-on de visor 3D/AR.
  if (!storeConfig.isLoaded) storeConfig.fetchConfig()
})
</script>
