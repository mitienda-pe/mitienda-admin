<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import { productsApi } from '@/api/products.api'
import type { Product } from '@/types/product.types'

/**
 * Ajustes de la calculadora de pisos: qué productos la usan y cómo se venden.
 *  - Por caja: m² y piezas por caja (alfombra modular, pisos SPC).
 *  - Por m² en rollo: ancho del rollo (alfombra en rollo); se compra en m²
 *    enteros.
 * El comerciante agrega productos de su catálogo con el buscador: al elegir
 * uno, los datos se completan desde el título cuando los trae
 * ("POR CAJA (5.00m2)", "50X50CM", "... M2").
 *
 * Si la asignación está en prueba (`previewDomains`), la calculadora solo se ve
 * en esos dominios; se avisa arriba. Quitar la prueba es tarea de MiTienda.
 */
type Unit = 'box' | 'm2'

interface ProductRow {
  unit?: Unit
  coverage?: number
  pieces?: number
  tile?: string
  rollWidth?: number
  name?: string
  [key: string]: unknown
}

interface EditableConfig {
  products: Record<string, ProductRow>
  wasteOptions: number[]
}

interface Props {
  config: (Partial<EditableConfig> & { previewDomains?: string[] }) | null
  configSchema?: Record<string, unknown> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', config: EditableConfig): void }>()

function pickEditable(): EditableConfig {
  const c = props.config ?? {}
  return JSON.parse(JSON.stringify({
    products: c.products ?? {},
    wasteOptions: c.wasteOptions?.length ? c.wasteOptions : [0, 5, 10],
  }))
}

const form = ref<EditableConfig>(pickEditable())
const original = ref(JSON.stringify(form.value))
const wasteText = ref(form.value.wasteOptions.join(', '))

watch(
  () => props.config,
  () => {
    form.value = pickEditable()
    original.value = JSON.stringify(form.value)
    wasteText.value = form.value.wasteOptions.join(', ')
  },
)

watch(wasteText, (text) => {
  form.value.wasteOptions = text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 50)
})

const preview = computed(() => props.config?.previewDomains ?? [])
const products = computed(() => Object.entries(form.value.products))
const isDirty = computed(() => JSON.stringify(form.value) !== original.value)

const unitOf = (p: ProductRow): Unit => (p.unit === 'm2' ? 'm2' : 'box')

const errors = computed(() => {
  const out: string[] = []
  for (const [id, p] of products.value) {
    const label = p.name || `Producto ${id}`
    if (unitOf(p) === 'box' && !(Number(p.coverage) > 0)) out.push(`${label}: indica los m² por caja.`)
    // v-model.number deja '' cuando se borra el campo: vacío es válido.
    const width = p.rollWidth as number | string | null | undefined
    if (unitOf(p) === 'm2' && width !== undefined && width !== null && width !== '' && !(Number(width) > 0)) {
      out.push(`${label}: el ancho del rollo debe ser mayor a 0 (o déjalo vacío).`)
    }
  }
  if (!form.value.wasteOptions.length) out.push('Deja al menos una opción de merma (por ejemplo 0).')
  return out
})

// ─── Agregar productos ───────────────────────────────────────
const query = ref('')
const results = ref<Product[]>([])
const searching = ref(false)
const searchError = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
let searchSeq = 0

watch(query, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchError.value = ''
  if (q.trim().length < 3) {
    results.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq
    searching.value = true
    try {
      const res = await productsApi.getProducts({ search: q.trim(), limit: 10 })
      // Solo vale la respuesta de la última búsqueda tipeada.
      if (seq === searchSeq) results.value = res.data ?? []
    } catch {
      if (seq === searchSeq) searchError.value = 'No se pudo buscar. Intenta de nuevo.'
    } finally {
      if (seq === searchSeq) searching.value = false
    }
  }, 350)
})

/**
 * Datos de la calculadora leídos del título: "POR CAJA (5.00m2)" → por caja con
 * 5 m²; "50X50CM" → piezas; "... M2" sin "caja" → rollo vendido por m².
 */
function guessRow(name: string): ProductRow {
  const m2 = [...name.matchAll(/(\d+(?:[.,]\d+)?)\s*m2/gi)].pop()
  const isBox = /caja/i.test(name)
  if (!isBox && /\bM2\b/i.test(name)) {
    return { unit: 'm2', name }
  }
  const row: ProductRow = { unit: 'box', name }
  if (m2?.[1]) row.coverage = Number(m2[1].replace(',', '.'))
  const tile = name.match(/(\d+)\s*x\s*(\d+)\s*cm/i)
  if (tile && row.coverage) {
    const a = Number(tile[1])
    const b = Number(tile[2])
    row.tile = `${a} × ${b} cm`
    row.pieces = Math.round(row.coverage / ((a * b) / 10000))
  }
  return row
}

function addProduct(p: Product) {
  const id = String(p.id)
  if (!form.value.products[id]) {
    form.value.products = { ...form.value.products, [id]: guessRow(p.name) }
  }
  query.value = ''
  results.value = []
}

function removeProduct(id: string) {
  const next = { ...form.value.products }
  delete next[id]
  form.value.products = next
}

function setUnit(p: ProductRow, unit: Unit) {
  p.unit = unit
}

function submit() {
  if (errors.value.length) return
  const out: EditableConfig = JSON.parse(JSON.stringify(form.value))
  // Campos numéricos borrados ('' de v-model.number) no se guardan.
  for (const row of Object.values(out.products)) {
    for (const key of ['coverage', 'pieces', 'rollWidth'] as const) {
      if ((row[key] as unknown) === '' || row[key] === null) delete row[key]
    }
  }
  emit('update', out)
}

const input = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none'
const th = 'px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <p v-if="preview.length" class="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      En prueba: la calculadora solo se ve en {{ preview.join(', ') }}. En tu dominio los productos se venden como siempre
      hasta que se apruebe.
    </p>

    <label class="block max-w-sm">
      <span class="mb-1 block text-sm font-medium text-gray-700">Opciones de merma (%)</span>
      <input v-model="wasteText" type="text" :class="input" placeholder="0, 5, 10">
      <span class="mt-1 block text-xs text-gray-500">Separadas por coma. El cliente elige una.</span>
    </label>

    <section>
      <h3 class="text-base font-semibold text-gray-900">Productos con calculadora</h3>
      <p class="mb-3 text-sm text-gray-500">
        El precio del producto debe ser el de la unidad que se vende: la caja completa, o el m² si es alfombra en rollo.
        La calculadora propone cuánto comprar; no cambia el precio.
      </p>

      <!-- Agregar -->
      <div class="relative mb-4 max-w-xl">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Agregar producto</span>
          <input
            v-model="query"
            type="search"
            :class="input"
            placeholder="Busca por nombre o SKU (mínimo 3 letras)"
            autocomplete="off"
          >
        </label>
        <p v-if="searching" class="mt-1 text-xs text-gray-500">Buscando…</p>
        <p v-if="searchError" class="mt-1 text-xs text-red-600">{{ searchError }}</p>
        <ul
          v-if="results.length"
          class="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg"
        >
          <li v-for="p in results" :key="p.id">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!!form.products[String(p.id)]"
              @click="addProduct(p)"
            >
              <span class="min-w-0">
                <span class="block truncate text-gray-900">{{ p.name }}</span>
                <span class="text-xs text-gray-400">{{ p.sku }}</span>
              </span>
              <span class="shrink-0 text-xs text-gray-500">{{ form.products[String(p.id)] ? 'Ya está' : 'Agregar' }}</span>
            </button>
          </li>
        </ul>
        <p v-else-if="query.trim().length >= 3 && !searching && !searchError" class="mt-1 text-xs text-gray-500">
          Sin resultados.
        </p>
      </div>

      <p v-if="!products.length" class="rounded border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
        Todavía no hay productos con calculadora. Agrega el primero con el buscador.
      </p>
      <div v-else class="overflow-x-auto rounded border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th :class="th">Producto</th>
              <th :class="th">Se vende por</th>
              <th :class="th">m² por caja / Ancho de rollo (m)</th>
              <th :class="th">Piezas por caja</th>
              <th :class="th">Baldosa</th>
              <th :class="th"><span class="sr-only">Quitar</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="[id, p] in products" :key="id">
              <td class="px-2 py-2 text-sm">
                <span class="text-gray-900">{{ p.name || `Producto ${id}` }}</span>
                <span class="block text-xs text-gray-400">#{{ id }}</span>
              </td>
              <td class="w-36 px-2 py-2">
                <select
                  :value="unitOf(p)"
                  :class="input"
                  :aria-label="`Cómo se vende ${p.name || id}`"
                  @change="setUnit(p, ($event.target as HTMLSelectElement).value as Unit)"
                >
                  <option value="box">Caja</option>
                  <option value="m2">m² (rollo)</option>
                </select>
              </td>
              <td class="w-40 px-2 py-2">
                <input
                  v-if="unitOf(p) === 'box'"
                  v-model.number="p.coverage"
                  type="number" min="0.01" step="0.01" :class="input" placeholder="m² por caja"
                  :aria-label="`m² por caja de ${p.name || id}`"
                >
                <input
                  v-else
                  v-model.number="p.rollWidth"
                  type="number" min="0.01" step="0.01" :class="input" placeholder="Ancho del rollo"
                  :aria-label="`Ancho del rollo de ${p.name || id}`"
                >
              </td>
              <td class="w-28 px-2 py-2">
                <input v-if="unitOf(p) === 'box'" v-model.number="p.pieces" type="number" min="1" step="1" :class="input" :aria-label="`Piezas por caja de ${p.name || id}`">
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-2 py-2">
                <input v-if="unitOf(p) === 'box'" v-model="p.tile" type="text" :class="input" placeholder="50 × 50 cm" :aria-label="`Tamaño de baldosa de ${p.name || id}`">
                <span v-else class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-2 py-2 text-right">
                <button type="button" class="text-sm text-red-600 hover:underline" :aria-label="`Quitar ${p.name || id} de la calculadora`" @click="removeProduct(id)">
                  Quitar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ul v-if="errors.length" class="space-y-1 text-sm text-red-600">
      <li v-for="msg in errors" :key="msg">{{ msg }}</li>
    </ul>

    <div class="sticky bottom-0 flex justify-end bg-white/90 py-3 backdrop-blur">
      <AppButton type="submit" :disabled="!isDirty || errors.length > 0">Guardar cambios</AppButton>
    </div>
  </form>
</template>
