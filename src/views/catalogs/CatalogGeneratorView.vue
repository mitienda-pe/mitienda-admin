<template>
  <div class="p-4 md:p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Catálogos PDF</h1>
      <p class="text-gray-500 mt-1">
        Genera un catálogo de productos en PDF (A4) para compartir con tus clientes.
        Máximo {{ CATALOG_MAX_PRODUCTS }} productos por catálogo.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Formulario -->
      <Card class="lg:col-span-3">
        <template #content>
          <form class="space-y-6" @submit.prevent="onSubmit">
            <!-- Nombre -->
            <AppInput
              v-model="form.nombre"
              label="Nombre del catálogo"
              placeholder="Ej. Catálogo Primavera 2026"
              :error="errors.nombre"
            />

            <!-- Alcance -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Alcance</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="opt in scopeOptions"
                  :key="opt.value"
                  type="button"
                  class="border rounded-lg px-3 py-2 text-sm text-left transition"
                  :class="form.scope === opt.value
                    ? 'border-primary bg-primary-50 text-primary font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                  @click="form.scope = opt.value"
                >
                  <i :class="opt.icon" class="mr-2" />{{ opt.label }}
                </button>
              </div>

              <!-- Selector por categoría -->
              <div v-if="form.scope === 'category'" class="mt-3">
                <Dropdown
                  v-model="form.category_id"
                  :options="categories"
                  option-label="name"
                  option-value="id"
                  filter
                  placeholder="Selecciona una categoría"
                  class="w-full"
                />
              </div>

              <!-- Selector por marca -->
              <div v-else-if="form.scope === 'brand'" class="mt-3">
                <Dropdown
                  v-model="form.brand_id"
                  :options="brands"
                  option-label="name"
                  option-value="id"
                  filter
                  placeholder="Selecciona una marca"
                  class="w-full"
                />
              </div>

              <!-- Selección de lista de productos -->
              <div v-else-if="form.scope === 'list'" class="mt-3">
                <Dropdown
                  v-model="form.list_id"
                  :options="productLists"
                  option-label="name"
                  option-value="id"
                  filter
                  :placeholder="productLists.length ? 'Selecciona una lista' : 'No hay listas de productos'"
                  :empty-message="'Aún no tienes listas. Créalas en Catálogo → Listas.'"
                  class="w-full"
                />
                <p class="text-xs text-gray-400 mt-1">
                  El catálogo respetará el orden de la lista.
                </p>
              </div>
              <p v-if="errors.scope" class="text-danger text-xs mt-1">{{ errors.scope }}</p>
            </div>

            <!-- Productos por página -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Productos por página</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="pp in perPageOptions"
                  :key="pp"
                  type="button"
                  class="border rounded-lg py-3 flex flex-col items-center gap-1 transition"
                  :class="form.per_page === pp
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'"
                  @click="form.per_page = pp"
                >
                  <span class="font-bold text-lg">{{ pp }}</span>
                  <span class="text-[10px]">por página</span>
                </button>
              </div>
            </div>

            <!-- Portada -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Portada</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in coverOptions"
                  :key="opt.value"
                  type="button"
                  class="border rounded-lg px-3 py-2 text-sm transition"
                  :class="form.cover_type === opt.value
                    ? 'border-primary bg-primary-50 text-primary font-medium'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                  @click="form.cover_type = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-2">
                <template v-if="form.cover_type === 'auto'">
                  Se generará con el logo de tu tienda, el nombre del catálogo y la fecha.
                </template>
                <template v-else-if="form.cover_type === 'uploaded'">
                  Sube una imagen de portada (se mostrará a página completa).
                </template>
                <template v-else>Sin portada, el catálogo empieza directo con los productos.</template>
              </p>

              <!-- Subir portada -->
              <div v-if="form.cover_type === 'uploaded'" class="mt-3">
                <input type="file" accept="image/*" :disabled="uploadingCover" @change="onCoverSelected" />
                <span v-if="uploadingCover" class="text-xs text-gray-400 ml-2">
                  <i class="pi pi-spinner pi-spin" /> Subiendo…
                </span>
                <img v-if="form.cover_url" :src="form.cover_url" class="mt-2 h-24 rounded border object-cover" />
              </div>
            </div>

            <!-- Contenido de la viñeta -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contenido de la viñeta</label>
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="form.show_description" class="accent-primary w-4 h-4" />
                <span class="text-sm text-gray-700">Incluir descripción corta</span>
              </label>
              <p class="text-xs text-gray-400 mt-1">
                Muestra un extracto de la descripción del producto (no aplica en el layout de 9 por página).
              </p>
            </div>

            <AppButton
              type="submit"
              label="Generar catálogo"
              icon="pi pi-file-pdf"
              :loading="submitting"
              block
            />
          </form>
        </template>
      </Card>

      <!-- Historial -->
      <Card class="lg:col-span-2">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-base">Historial</span>
            <button class="text-gray-400 hover:text-primary" title="Actualizar" @click="loadHistory">
              <i class="pi pi-refresh text-sm" />
            </button>
          </div>
        </template>
        <template #content>
          <AppEmptyState
            v-if="!loadingHistory && history.length === 0"
            icon="pi pi-file-pdf"
            title="Sin catálogos"
            description="Genera tu primer catálogo con el formulario."
          />
          <ul v-else class="divide-y">
            <li v-for="cat in history" :key="cat.id" class="py-3 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-800 truncate">{{ cat.name }}</p>
                <p class="text-xs text-gray-400">
                  {{ scopeLabel(cat.scope) }} · {{ cat.per_page }}/pág
                  <template v-if="cat.product_count"> · {{ cat.product_count }} prod.</template>
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <AppBadge v-bind="statusBadge(cat.status)" size="small" />
                <a
                  v-if="cat.status === 'done' && cat.r2_url"
                  :href="cat.r2_url"
                  target="_blank"
                  download
                  class="text-primary text-sm"
                  title="Descargar PDF"
                >
                  <i class="pi pi-download" />
                </a>
              </div>
            </li>
          </ul>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import { AppButton, AppInput, AppBadge, AppEmptyState } from '@/components/ui'
import { catalogPdfApi } from '@/api/catalog-pdf.api'
import { brandApi } from '@/api/brand.api'
import { catalogApi } from '@/api/catalog.api'
import { productListApi } from '@/api/product-list.api'
import {
  CATALOG_MAX_PRODUCTS,
  type Catalog,
  type CatalogScope,
  type CatalogPerPage,
  type CatalogCoverType,
  type CreateCatalogPayload
} from '@/types/catalog-pdf.types'

const toast = useToast()

const form = reactive({
  nombre: '',
  scope: 'all' as CatalogScope,
  per_page: 4 as CatalogPerPage,
  cover_type: 'auto' as CatalogCoverType,
  show_description: true,
  cover_url: '' as string,
  category_id: undefined as number | undefined,
  brand_id: undefined as number | undefined,
  list_id: undefined as number | undefined
})

const errors = reactive<{ nombre?: string; scope?: string }>({})
const submitting = ref(false)

const scopeOptions: { value: CatalogScope; label: string; icon: string }[] = [
  { value: 'all', label: 'Todos los productos', icon: 'pi pi-box' },
  { value: 'category', label: 'Por categoría', icon: 'pi pi-folder' },
  { value: 'brand', label: 'Por marca', icon: 'pi pi-tag' },
  { value: 'list', label: 'Lista de productos', icon: 'pi pi-list' }
]
const perPageOptions: CatalogPerPage[] = [2, 3, 4, 9]
const coverOptions: { value: CatalogCoverType; label: string }[] = [
  { value: 'auto', label: 'Automática' },
  { value: 'uploaded', label: 'Subir imagen' },
  { value: 'none', label: 'Sin portada' }
]

// ── Categorías / marcas ──────────────────────────────────────────
const categories = ref<{ id: number; name: string }[]>([])
const brands = ref<{ id: number; name: string }[]>([])

async function loadCategories() {
  const res = await catalogApi.getCategories()
  if (res.success && res.data) categories.value = res.data.map(c => ({ id: c.id, name: c.name }))
}
async function loadBrands() {
  const res = await brandApi.getAll()
  if (res.success && res.data) brands.value = res.data.map((b: any) => ({ id: b.id, name: b.name }))
}

// ── Listas de productos ──────────────────────────────────────────
const productLists = ref<{ id: number; name: string }[]>([])

async function loadProductLists() {
  const res = await productListApi.getAll()
  if (res.success && res.data) {
    productLists.value = res.data.map((l: any) => ({
      id: l.productolista_id,
      name: l.productolista_nombre
    }))
  }
}

// ── Portada subida ───────────────────────────────────────────────
const uploadingCover = ref(false)
async function onCoverSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingCover.value = true
  try {
    // Sube a R2 y guarda la URL pública (no un data URL — no cabe en la DB).
    form.cover_url = await catalogPdfApi.uploadCover(file)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la portada', life: 4000 })
  } finally {
    uploadingCover.value = false
  }
}

// ── Submit ───────────────────────────────────────────────────────
function validate(): boolean {
  errors.nombre = undefined
  errors.scope = undefined
  if (!form.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  if (form.scope === 'category' && !form.category_id) errors.scope = 'Selecciona una categoría'
  if (form.scope === 'brand' && !form.brand_id) errors.scope = 'Selecciona una marca'
  if (form.scope === 'list' && !form.list_id) errors.scope = 'Selecciona una lista de productos'
  return !errors.nombre && !errors.scope
}

async function onSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    const payload: CreateCatalogPayload = {
      nombre: form.nombre.trim(),
      scope: form.scope,
      per_page: form.per_page,
      cover_type: form.cover_type,
      show_description: form.show_description
    }
    if (form.scope === 'category') payload.category_id = form.category_id
    if (form.scope === 'brand') payload.brand_id = form.brand_id
    if (form.scope === 'list') payload.list_id = form.list_id
    if (form.cover_type === 'uploaded' && form.cover_url) payload.cover_url = form.cover_url

    const { catalog_id } = await catalogPdfApi.createCatalog(payload)
    toast.add({ severity: 'success', summary: 'Catálogo en cola', detail: 'Generando el PDF…', life: 3000 })
    await loadHistory()
    startPolling(catalog_id)
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'No se pudo generar el catálogo'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 })
  } finally {
    submitting.value = false
  }
}

// ── Historial + polling ──────────────────────────────────────────
const history = ref<Catalog[]>([])
const loadingHistory = ref(false)
const pollTimers = new Map<number, ReturnType<typeof setInterval>>()

async function loadHistory() {
  loadingHistory.value = true
  try {
    const { data } = await catalogPdfApi.listCatalogs({ limit: 20 })
    history.value = data
    // Reanudar polling de los que sigan en proceso.
    data.filter(c => c.status === 'queued' || c.status === 'processing').forEach(c => startPolling(c.id))
  } finally {
    loadingHistory.value = false
  }
}

function startPolling(id: number) {
  if (pollTimers.has(id)) return
  const startedAt = Date.now()
  const timer = setInterval(async () => {
    // Tope de ~2 min para no quedar colgado.
    if (Date.now() - startedAt > 120000) return stopPolling(id)
    try {
      const cat = await catalogPdfApi.getCatalog(id)
      const idx = history.value.findIndex(c => c.id === id)
      if (idx >= 0) history.value[idx] = cat
      if (cat.status === 'done') {
        stopPolling(id)
        toast.add({ severity: 'success', summary: 'Catálogo listo', detail: cat.name, life: 4000 })
      } else if (cat.status === 'failed') {
        stopPolling(id)
        toast.add({ severity: 'error', summary: 'Falló la generación', detail: cat.error || cat.name, life: 6000 })
      }
    } catch {
      stopPolling(id)
    }
  }, 3000)
  pollTimers.set(id, timer)
}
function stopPolling(id: number) {
  const t = pollTimers.get(id)
  if (t) { clearInterval(t); pollTimers.delete(id) }
}

// ── Helpers de presentación ──────────────────────────────────────
function scopeLabel(scope: CatalogScope): string {
  return scopeOptions.find(o => o.value === scope)?.label ?? scope
}
function statusBadge(status: string) {
  switch (status) {
    case 'done': return { label: 'Listo', variant: 'success' as const }
    case 'failed': return { label: 'Falló', variant: 'danger' as const }
    case 'processing': return { label: 'Generando', variant: 'info' as const }
    default: return { label: 'En cola', variant: 'neutral' as const }
  }
}

onMounted(() => {
  loadCategories()
  loadBrands()
  loadProductLists()
  loadHistory()
})
onUnmounted(() => {
  pollTimers.forEach(t => clearInterval(t))
  pollTimers.clear()
})
</script>
