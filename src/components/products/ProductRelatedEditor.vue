<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import { productsApi } from '@/api/products.api'
import type { RelatedProductItem } from '@/api/products.api'

interface Props {
  productId: number
}

const props = defineProps<Props>()
const toast = useToast()

const items = ref<RelatedProductItem[]>([])
const savedIds = ref<number[]>([])
const maxItems = ref(12)
const isLoading = ref(true)
const isSaving = ref(false)

// Buscador
const search = ref('')
const results = ref<RelatedProductItem[]>([])
const isSearching = ref(false)
let searchToken = 0

const currentIds = computed(() => items.value.map((item) => item.id))
const isFull = computed(() => items.value.length >= maxItems.value)
const hasChanges = computed(
  () =>
    currentIds.value.length !== savedIds.value.length ||
    currentIds.value.some((id, index) => id !== savedIds.value[index])
)

onMounted(load)

async function load() {
  isLoading.value = true
  try {
    const response = await productsApi.getRelated(props.productId)
    if (response.success && response.data) {
      items.value = response.data.items
      savedIds.value = response.data.items.map((item) => item.id)
      maxItems.value = response.data.max
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los productos relacionados',
      life: 4000,
    })
  } finally {
    isLoading.value = false
  }
}

// Búsqueda con debounce. `searchToken` descarta respuestas de tipeos viejos:
// sin eso una consulta lenta puede pisar los resultados de una más reciente.
let debounce: ReturnType<typeof setTimeout> | undefined
watch(search, (term) => {
  clearTimeout(debounce)
  const query = term.trim()
  if (query.length < 2) {
    results.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  debounce = setTimeout(() => runSearch(query), 300)
})

async function runSearch(query: string) {
  const token = ++searchToken
  try {
    const response = await productsApi.getProducts({ search: query, limit: 20, page: 1 })
    if (token !== searchToken) return
    results.value = (response.data || []).map((product) => ({
      id: product.id,
      sku: product.sku ?? null,
      name: product.name,
      published: product.published ?? true,
    }))
  } catch {
    if (token === searchToken) results.value = []
  } finally {
    if (token === searchToken) isSearching.value = false
  }
}

const availableResults = computed(() =>
  results.value.filter(
    (result) => result.id !== props.productId && !currentIds.value.includes(result.id)
  )
)

function add(product: RelatedProductItem) {
  if (isFull.value) return
  items.value.push(product)
  search.value = ''
  results.value = []
}

function remove(index: number) {
  items.value.splice(index, 1)
}

function move(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= items.value.length) return
  const [item] = items.value.splice(index, 1)
  items.value.splice(target, 0, item)
}

async function save() {
  isSaving.value = true
  try {
    const response = await productsApi.saveRelated(props.productId, currentIds.value)
    if (response.success && response.data) {
      items.value = response.data.items
      savedIds.value = response.data.items.map((item) => item.id)
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: response.message || 'Productos relacionados actualizados',
        life: 3000,
      })
    } else {
      throw new Error(response.message)
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail:
        error?.response?.data?.messages?.error ||
        error?.message ||
        'No se pudieron guardar los productos relacionados',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else class="space-y-4">
      <p class="text-sm text-gray-500">
        Elegí a mano qué productos acompañan a este en «También te puede interesar». Mientras haya
        alguno acá, se muestran exactamente estos y en este orden. Si lo dejás vacío, manda la
        configuración de la tienda (Apariencia → Catálogo).
      </p>

      <!-- Vinculados -->
      <div v-if="items.length > 0" class="border rounded-lg divide-y">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="flex items-center gap-3 px-3 py-2"
        >
          <span class="text-xs text-gray-400 w-5 text-center">{{ index + 1 }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-800 truncate">{{ item.name }}</p>
            <p class="text-xs text-gray-400">
              <span v-if="item.sku">SKU {{ item.sku }}</span>
              <span v-if="!item.published" class="text-amber-600">
                <span v-if="item.sku"> · </span>Despublicado: no se mostrará en la tienda
              </span>
            </p>
          </div>
          <div class="flex items-center gap-1">
            <Button
              icon="pi pi-arrow-up"
              text
              rounded
              size="small"
              :disabled="index === 0"
              aria-label="Subir"
              @click="move(index, -1)"
            />
            <Button
              icon="pi pi-arrow-down"
              text
              rounded
              size="small"
              :disabled="index === items.length - 1"
              aria-label="Bajar"
              @click="move(index, 1)"
            />
            <Button
              icon="pi pi-times"
              text
              rounded
              severity="danger"
              size="small"
              aria-label="Quitar"
              @click="remove(index)"
            />
          </div>
        </div>
      </div>

      <div v-else class="border border-dashed rounded-lg py-6 text-center text-gray-400">
        <i class="pi pi-link text-2xl mb-2 block" />
        <p class="text-sm">Sin vínculos manuales — este producto usa el modo automático</p>
      </div>

      <!-- Buscador -->
      <div>
        <div class="relative">
          <InputText
            v-model="search"
            :disabled="isFull"
            :placeholder="
              isFull
                ? `Llegaste al máximo de ${maxItems} productos`
                : 'Buscar producto por nombre o SKU...'
            "
            class="w-full"
          />
          <i
            v-if="isSearching"
            class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <div
          v-if="availableResults.length > 0"
          class="border rounded-lg divide-y mt-2 max-h-64 overflow-y-auto"
        >
          <button
            v-for="result in availableResults"
            :key="result.id"
            type="button"
            class="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
            @click="add(result)"
          >
            <p class="text-sm text-gray-800 truncate">{{ result.name }}</p>
            <p v-if="result.sku" class="text-xs text-gray-400">SKU {{ result.sku }}</p>
          </button>
        </div>

        <p
          v-else-if="search.trim().length >= 2 && !isSearching"
          class="text-xs text-gray-400 mt-2"
        >
          Sin resultados para «{{ search.trim() }}»
        </p>
      </div>

      <div class="flex items-center justify-between pt-2">
        <span class="text-xs text-gray-400">{{ items.length }} de {{ maxItems }}</span>
        <Button
          label="Guardar relacionados"
          icon="pi pi-check"
          size="small"
          :loading="isSaving"
          :disabled="!hasChanges || isSaving"
          @click="save"
        />
      </div>
    </div>
  </div>
</template>
