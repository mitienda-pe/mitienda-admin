<template>
  <div class="h-full flex flex-col">
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="loadError" severity="error" :closable="false" class="mb-4">
      {{ loadError }}
    </Message>

    <!-- Page Editor -->
    <template v-else-if="page">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            @click="handleBack"
          />
          <div>
            <h1 class="text-2xl font-bold text-secondary">{{ page.title }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm text-secondary-400">/pagina/{{ page.slug }}</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="editorTypeBadgeClass"
              >
                <i :class="editorTypeIcon" class="mr-1"></i>
                {{ editorTypeLabel }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="page.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
              >
                {{ page.published ? 'Publicada' : 'Borrador' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="supportsAi"
            label="Asistente IA"
            icon="pi pi-sparkles"
            text
            @click="showAiPanel = true"
          />
          <Button
            v-if="supportsShortcodes"
            label="Insertar shortcode"
            icon="pi pi-bolt"
            text
            severity="secondary"
            @click="openShortcodeDialog"
          />
          <Button
            label="Vista Previa"
            icon="pi pi-eye"
            text
            severity="secondary"
            @click="$router.push({ name: 'page-preview', params: { id: page.id } })"
          />
          <Button
            label="Configuración"
            icon="pi pi-cog"
            text
            severity="secondary"
            @click="showSettings = true"
          />
          <Button
            label="Guardar"
            icon="pi pi-save"
            :loading="isSaving"
            @click="handleSave"
          />
        </div>
      </div>

      <!-- Editor Area -->
      <div class="flex-1 bg-white rounded-lg shadow overflow-hidden" style="min-height: 500px;">
        <PageContentEditor
          ref="editorRef"
          v-model="content"
          :editor-type="page.editor_type"
          :page-id="String(page.id)"
        />
      </div>
    </template>

    <!-- Settings Sidebar Dialog -->
    <Dialog
      v-model:visible="showSettings"
      header="Configuración de Página"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4" v-if="page">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Título</label>
          <InputText
            v-model="settingsForm.title"
            class="w-full"
          />
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">URL (slug)</label>
          <div class="flex items-center gap-2">
            <span class="text-secondary-400 text-sm">/</span>
            <InputText
              v-model="settingsForm.slug"
              class="w-full"
            />
          </div>
        </div>

        <!-- Published -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-secondary-700">Estado</label>
          <Button
            :label="settingsForm.published ? 'Publicada' : 'Borrador'"
            :icon="settingsForm.published ? 'pi pi-eye' : 'pi pi-eye-slash'"
            :severity="settingsForm.published ? 'success' : 'secondary'"
            size="small"
            outlined
            @click="settingsForm.published = !settingsForm.published"
          />
        </div>

        <!-- Meta SEO -->
        <Divider />
        <h3 class="text-sm font-semibold text-secondary-700">SEO</h3>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Meta título</label>
          <InputText
            v-model="settingsForm.meta_title"
            class="w-full"
            placeholder="Título para motores de búsqueda"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Meta descripción</label>
          <Textarea
            v-model="settingsForm.meta_description"
            class="w-full"
            rows="3"
            placeholder="Descripción para motores de búsqueda"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showSettings = false" />
        <Button
          label="Guardar Configuración"
          :loading="isSavingSettings"
          @click="handleSaveSettings"
        />
      </template>
    </Dialog>

    <!-- Insertar Shortcode Dialog -->
    <Dialog
      v-model:visible="showShortcode"
      header="Insertar shortcode"
      :modal="true"
      :style="{ width: '520px' }"
    >
      <div class="space-y-4">
        <p class="text-sm text-secondary-500">
          Los shortcodes insertan bloques dinámicos (productos, categorías,
          marcas, mapas) que se renderizan en tu tienda al ver la página.
        </p>

        <!-- Tipo de shortcode -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de bloque</label>
          <Dropdown
            v-model="shortcodeType"
            :options="SHORTCODE_TYPES"
            option-label="label"
            option-value="value"
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

          <!-- Select (orden) -->
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
        <Button label="Cancelar" text @click="showShortcode = false" />
        <Button
          label="Insertar"
          icon="pi pi-bolt"
          :disabled="!isShortcodeValid"
          @click="handleInsertShortcode"
        />
      </template>
    </Dialog>

    <!-- Asistente de HTML con IA -->
    <AiHtmlBuilderPanel
      v-if="page"
      v-model:visible="showAiPanel"
      :model-value="content"
      :button-id="AI_BUTTON_IDS.html.page"
      :context="page.title"
      @apply="handleAiApply"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePagesStore } from '@/stores/pages.store'
import { useCatalogStore } from '@/stores/catalog.store'
import { productsApi } from '@/api/products.api'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import AutoComplete from 'primevue/autocomplete'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageContentEditor from '@/components/pages/PageContentEditor.vue'
import AiHtmlBuilderPanel from '@/components/ai/AiHtmlBuilderPanel.vue'
import { AI_BUTTON_IDS } from '@/config/ai-buttons.config'
import type { Page, PageEditorType } from '@/types/page.types'
import type { Product } from '@/types/product.types'

// Catálogo de shortcodes disponibles. Cada entrada debe tener un widget
// equivalente registrado en el storefront (PageContentRenderer.vue).
//
// Cada shortcode declara sus `fields`; el diálogo los renderiza según `type`
// (text/number/product/category/brand/select) y serializa
// `[valor key="v" ...]`. Convención de valores: producto → id numérico;
// categoría/marca → slug (así lo espera el storefront).
type ShortcodeFieldType = 'text' | 'number' | 'product' | 'category' | 'brand' | 'select'

interface ShortcodeField {
  key: string
  label: string
  type: ShortcodeFieldType
  placeholder?: string
  help?: string
  required?: boolean
  options?: { label: string; value: string }[]
}

interface ShortcodeType {
  value: string
  label: string
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

const SHORTCODE_TYPES: ShortcodeType[] = [
  {
    value: 'producto',
    label: 'Producto (viñeta)',
    help: 'Muestra la tarjeta de un producto con su precio y botón de compra.',
    fields: [{ key: 'id', label: 'Producto', type: 'product', required: true }],
  },
  {
    value: 'agregar_carrito',
    label: 'Botón "Agregar al carrito"',
    help: 'Botón que agrega un producto puntual al carrito.',
    fields: [{ key: 'id', label: 'Producto', type: 'product', required: true }],
  },
  {
    value: 'productos',
    label: 'Lista de productos',
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
    fields: [{ key: 'titulo', label: 'Título (opcional)', type: 'text', placeholder: 'Categorías' }],
  },
  {
    value: 'marcas',
    label: 'Lista de marcas',
    fields: [{ key: 'titulo', label: 'Título (opcional)', type: 'text', placeholder: 'Marcas' }],
  },
  {
    value: 'storemapper',
    label: 'Storemapper (mapa de tiendas)',
    help: 'Widget externo. El ID lo encuentras en tu panel de Storemapper.',
    fields: [{ key: 'id', label: 'ID de Storemapper', type: 'text', placeholder: '29720-Bfq2LEYgpPsVNnZ9', required: true }],
  },
  {
    value: 'storepoint',
    label: 'Storepoint (mapa de tiendas)',
    help: "Widget externo. El ID está en el embed: new StorepointWidget('ESTE_ID', ...).",
    fields: [{ key: 'id', label: 'Widget ID de Storepoint', type: 'text', placeholder: '1690e3dbcdc582', required: true }],
  },
]

const route = useRoute()
const router = useRouter()
const pagesStore = usePagesStore()
const toast = useToast()

const page = ref<Page | null>(null)
const content = ref('')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)
const showSettings = ref(false)
const isSavingSettings = ref(false)
const editorRef = ref<{
  insertShortcode: (text: string) => void
  flushPendingChanges: () => Promise<void>
} | null>(null)

// Shortcode insertion
const catalogStore = useCatalogStore()
const showShortcode = ref(false)
const shortcodeType = ref<string>(SHORTCODE_TYPES[0].value)
// Valores por atributo del shortcode seleccionado (key → valor). Dropdown con
// show-clear puede escribir null; se normaliza a '' al serializar.
const shortcodeValues = reactive<Record<string, string | null>>({})
// Estado del picker de producto (AutoComplete). En v1 hay a lo sumo un campo
// producto por shortcode, así que un solo estado alcanza.
const productQuery = ref<Product | string | null>(null)
const productResults = ref<Product[]>([])

// Asistente de HTML con IA (solo editor de Código)
const showAiPanel = ref(false)

const supportsShortcodes = computed(
  () => page.value?.editor_type === 'wysiwyg' || page.value?.editor_type === 'code'
)

const supportsAi = computed(() => page.value?.editor_type === 'code')

const selectedShortcode = computed(() =>
  SHORTCODE_TYPES.find((s) => s.value === shortcodeType.value)
)

const generatedShortcode = computed(() => {
  const sc = selectedShortcode.value
  if (!sc) return ''
  const attrs = sc.fields
    .map((f) => {
      const v = (shortcodeValues[f.key] ?? '').toString().trim()
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

const openShortcodeDialog = () => {
  shortcodeType.value = SHORTCODE_TYPES[0].value
  resetShortcodeValues()
  showShortcode.value = true
  // Cargar catálogo para los dropdowns de categoría/marca (una sola vez).
  if (!catalogStore.categories.length) catalogStore.fetchCategories()
  if (!catalogStore.brands.length) catalogStore.fetchBrands()
}

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

const handleInsertShortcode = () => {
  if (!isShortcodeValid.value) return
  editorRef.value?.insertShortcode(generatedShortcode.value)
  showShortcode.value = false
}

const settingsForm = reactive({
  title: '',
  slug: '',
  published: false,
  meta_title: '',
  meta_description: '',
})

// Editor type helpers
const editorTypeLabel = computed(() => {
  const labels: Record<PageEditorType, string> = {
    wysiwyg: 'Editor Visual',
    code: 'Editor de Código',
    visual_builder: 'Visual Builder',
  }
  return page.value ? labels[page.value.editor_type] : ''
})

const editorTypeIcon = computed(() => {
  const icons: Record<PageEditorType, string> = {
    wysiwyg: 'pi pi-align-left',
    code: 'pi pi-code',
    visual_builder: 'pi pi-th-large',
  }
  return page.value ? icons[page.value.editor_type] : 'pi pi-file'
})

const editorTypeBadgeClass = computed(() => {
  const classes: Record<PageEditorType, string> = {
    wysiwyg: 'bg-primary/10 text-primary',
    code: 'bg-purple-100 text-purple-800',
    visual_builder: 'bg-orange-100 text-orange-800',
  }
  return page.value ? classes[page.value.editor_type] : 'bg-gray-100 text-gray-800'
})

const loadPage = async () => {
  const pageId = Number(route.params.id)

  try {
    isLoading.value = true
    loadError.value = null

    const result = await pagesStore.fetchPageById(pageId)

    if (result) {
      page.value = result
      content.value = result.content

      // Populate settings form
      settingsForm.title = result.title
      settingsForm.slug = result.slug
      settingsForm.published = result.published
      settingsForm.meta_title = result.meta_title || ''
      settingsForm.meta_description = result.meta_description || ''

      // Autoabrir el asistente IA cuando se viene de la tarjeta "Generar con IA".
      if (route.query.ai === '1' && result.editor_type === 'code') {
        showAiPanel.value = true
      }
    } else {
      loadError.value = 'Página no encontrada'
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.messages?.error || 'Error al cargar la página'
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!page.value) return

  try {
    isSaving.value = true

    // Fuerza el volcado de cambios pendientes del editor (el Visual Builder
    // emite con debounce de 300 ms; sin esto se perdía el último cambio).
    await editorRef.value?.flushPendingChanges?.()

    const updated = await pagesStore.updatePage(page.value.id, {
      content: content.value,
    })

    page.value = updated

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Contenido guardado exitosamente',
      life: 3000,
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

const handleSaveSettings = async () => {
  if (!page.value) return

  try {
    isSavingSettings.value = true

    const updated = await pagesStore.updatePage(page.value.id, {
      title: settingsForm.title,
      slug: settingsForm.slug,
      published: settingsForm.published,
      meta_title: settingsForm.meta_title || undefined,
      meta_description: settingsForm.meta_description || undefined,
    })

    if (page.value) {
      page.value.title = updated.title
      page.value.slug = updated.slug
      page.value.published = updated.published
      page.value.meta_title = updated.meta_title
      page.value.meta_description = updated.meta_description
    }

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Configuración actualizada',
      life: 3000,
    })

    showSettings.value = false
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar configuración',
      life: 5000,
    })
  } finally {
    isSavingSettings.value = false
  }
}

// Aplica el HTML generado por IA y lo guarda de inmediato, para que no se pierda
// al navegar a la vista previa (que carga la versión guardada del servidor).
const handleAiApply = async (html: string) => {
  content.value = html
  await handleSave()
}

const handleBack = () => {
  router.push({ name: 'pages-list' })
}

onMounted(() => {
  loadPage()
})
</script>
