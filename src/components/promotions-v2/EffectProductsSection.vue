<template>
  <div class="rounded-lg bg-white shadow">
    <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <div class="flex items-center gap-2">
        <i class="pi pi-box text-primary"></i>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Productos del efecto</h3>
          <p class="text-xs text-gray-500">
            {{ effectLabel }} — {{ linkedProducts.length }} producto(s) vinculados
          </p>
        </div>
      </div>
      <button
        class="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
        @click="showDialog = true"
      >
        <i class="pi pi-link mr-1"></i> Gestionar productos
      </button>
    </div>

    <!-- Linked products preview -->
    <div v-if="linkedProducts.length === 0" class="px-5 py-6 text-center">
      <p class="text-sm text-gray-400">Sin productos vinculados. Haz clic en "Gestionar productos" para agregar.</p>
    </div>
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="product in linkedProducts.slice(0, 10)"
        :key="product.id"
        class="flex items-center justify-between px-5 py-2.5"
      >
        <div class="flex items-center gap-3 min-w-0">
          <img
            v-if="product.image"
            :src="product.image"
            class="h-8 w-8 rounded object-cover flex-shrink-0"
            alt=""
          />
          <div class="h-8 w-8 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center" v-else>
            <i class="pi pi-image text-xs text-gray-400"></i>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
            <p class="text-xs text-gray-500">SKU: {{ product.sku || '-' }}</p>
          </div>
        </div>
      </div>
      <div v-if="linkedProducts.length > 10" class="px-5 py-2 text-center">
        <p class="text-xs text-gray-400">y {{ linkedProducts.length - 10 }} producto(s) más...</p>
      </div>
    </div>

    <!-- Link Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :modal="true"
      header="Vincular productos al efecto"
      :style="{ width: '900px', maxWidth: '95vw' }"
      :closable="!isSaving"
    >
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
      </div>

      <!-- Two panels -->
      <div v-else class="grid grid-cols-2 gap-4">
        <!-- Left: Available products -->
        <div class="rounded-lg border overflow-hidden">
          <div class="bg-gray-50 px-4 py-3 border-b">
            <h3 class="text-sm font-semibold text-gray-700">Productos disponibles</h3>
            <p class="text-xs text-gray-400 mt-0.5">{{ unlinkedProducts.length }} productos sin vincular</p>
          </div>

          <div class="p-3 border-b">
            <input
              v-model="searchUnlinked"
              type="text"
              placeholder="Buscar productos..."
              class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
            />
            <div v-if="filteredUnlinked.length > 0" class="flex justify-end mt-2">
              <button
                v-if="selectedUnlinked.length < filteredUnlinked.length"
                type="button"
                class="text-xs text-primary hover:underline"
                @click="selectedUnlinked = filteredUnlinked.map(p => p.id)"
              >
                Seleccionar todos ({{ filteredUnlinked.length }})
              </button>
              <button
                v-else
                type="button"
                class="text-xs text-gray-500 hover:underline"
                @click="selectedUnlinked = []"
              >
                Deseleccionar todos
              </button>
            </div>
          </div>

          <div class="h-80 overflow-y-auto">
            <div v-if="filteredUnlinked.length === 0" class="p-4 text-center text-gray-400">
              <i class="pi pi-inbox mb-2 text-2xl"></i>
              <p class="text-sm">{{ searchUnlinked ? 'Sin resultados' : 'No hay productos disponibles' }}</p>
            </div>
            <div v-else class="divide-y">
              <label
                v-for="product in filteredUnlinked"
                :key="product.id"
                class="flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  :checked="selectedUnlinked.includes(product.id)"
                  @change="toggleSelection(selectedUnlinked, product.id)"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
                  <p class="text-xs text-gray-500">SKU: {{ product.sku || '-' }}</p>
                </div>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
            <span class="text-sm text-gray-500">{{ selectedUnlinked.length }} seleccionados</span>
            <button
              class="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              :disabled="selectedUnlinked.length === 0 || isSaving"
              @click="linkSelected"
            >
              Agregar <i class="pi pi-arrow-right ml-1"></i>
            </button>
          </div>
        </div>

        <!-- Right: Linked products -->
        <div class="rounded-lg border overflow-hidden">
          <div class="bg-primary/5 px-4 py-3 border-b">
            <h3 class="text-sm font-semibold text-primary">Productos vinculados</h3>
            <p class="text-xs text-primary/70 mt-0.5">{{ linkedProductsDialog.length }} productos en este efecto</p>
          </div>

          <div class="p-3 border-b">
            <input
              v-model="searchLinked"
              type="text"
              placeholder="Buscar vinculados..."
              class="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
            />
            <div v-if="filteredLinked.length > 0" class="flex justify-end mt-2">
              <button
                v-if="selectedLinked.length < filteredLinked.length"
                type="button"
                class="text-xs text-primary hover:underline"
                @click="selectedLinked = filteredLinked.map(p => p.id)"
              >
                Seleccionar todos ({{ filteredLinked.length }})
              </button>
              <button
                v-else
                type="button"
                class="text-xs text-gray-500 hover:underline"
                @click="selectedLinked = []"
              >
                Deseleccionar todos
              </button>
            </div>
          </div>

          <div class="h-80 overflow-y-auto">
            <div v-if="filteredLinked.length === 0" class="p-4 text-center text-gray-400">
              <i class="pi pi-inbox mb-2 text-2xl"></i>
              <p class="text-sm">{{ searchLinked ? 'Sin resultados' : 'No hay productos vinculados' }}</p>
            </div>
            <div v-else class="divide-y">
              <label
                v-for="product in filteredLinked"
                :key="product.id"
                class="flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  :checked="selectedLinked.includes(product.id)"
                  @change="toggleSelection(selectedLinked, product.id)"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
                  <p class="text-xs text-gray-500">SKU: {{ product.sku || '-' }}</p>
                </div>
              </label>
            </div>
          </div>

          <div class="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
            <button
              class="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              :disabled="selectedLinked.length === 0 || isSaving"
              @click="unlinkSelected"
            >
              <i class="pi pi-arrow-left mr-1"></i> Quitar
            </button>
            <span class="text-sm text-gray-500">{{ selectedLinked.length }} seleccionados</span>
          </div>
        </div>
      </div>

      <template #footer>
        <button
          class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showDialog = false"
          :disabled="isSaving"
        >
          Cerrar
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { productsApi } from '@/api/products.api'
import { usePromotionV2Store } from '@/stores/promotion-v2.store'

interface ProductItem {
  id: number
  sku: string
  name: string
  image?: string
}

const props = defineProps<{
  promotionId: number
  effect: {
    effect_id: number
    type: string
    config: Record<string, any> | null
  }
}>()

const store = usePromotionV2Store()

const effectLabel = computed(() => {
  const config = props.effect.config || {}
  if (props.effect.type === 'percentage_discount_product') {
    return `${config.percentage || 0}% descuento`
  }
  if (props.effect.type === 'override_price') {
    const price = config.new_price
    return price ? `Precio especial: S/ ${(price / 100).toFixed(2)}` : 'Precio especial'
  }
  if (props.effect.type === 'gift_product') {
    return `${config.gift_quantity || 1} unidad(es) gratis`
  }
  return props.effect.type
})

const showDialog = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const allProducts = ref<ProductItem[]>([])
const searchUnlinked = ref('')
const searchLinked = ref('')
const selectedUnlinked = ref<number[]>([])
const selectedLinked = ref<number[]>([])

const productIds = computed<number[]>(() =>
  props.effect.config?.product_ids || []
)

// Products with full details for the preview card
const linkedProducts = computed(() =>
  allProducts.value.filter(p => productIds.value.includes(p.id))
)

// Dialog-specific computed (uses allProducts loaded when dialog opens)
const linkedProductsDialog = computed(() =>
  allProducts.value.filter(p => productIds.value.includes(p.id))
)

const unlinkedProducts = computed(() =>
  allProducts.value.filter(p => !productIds.value.includes(p.id))
)

const filteredUnlinked = computed(() => {
  if (!searchUnlinked.value) return unlinkedProducts.value
  const q = searchUnlinked.value.toLowerCase()
  return unlinkedProducts.value.filter(p =>
    p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
  )
})

const filteredLinked = computed(() => {
  if (!searchLinked.value) return linkedProductsDialog.value
  const q = searchLinked.value.toLowerCase()
  return linkedProductsDialog.value.filter(p =>
    p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
  )
})

function toggleSelection(list: number[], id: number) {
  const index = list.indexOf(id)
  if (index >= 0) {
    list.splice(index, 1)
  } else {
    list.push(id)
  }
}

async function loadAllProducts() {
  isLoading.value = true
  try {
    const response = await productsApi.getProducts({ limit: 1000 })
    allProducts.value = (response.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      image: p.images?.[0]?.url || null,
    }))
  } catch {
    allProducts.value = []
  } finally {
    isLoading.value = false
  }
}

async function updateProductIds(newIds: number[]) {
  isSaving.value = true
  try {
    const updatedConfig = {
      ...props.effect.config,
      product_ids: newIds,
    }
    await store.editRule(
      props.promotionId,
      'effects',
      props.effect.effect_id,
      { type: props.effect.type, config: updatedConfig }
    )
  } finally {
    isSaving.value = false
  }
}

async function linkSelected() {
  const newIds = [...productIds.value, ...selectedUnlinked.value]
  await updateProductIds(newIds)
  selectedUnlinked.value = []
}

async function unlinkSelected() {
  const newIds = productIds.value.filter(id => !selectedLinked.value.includes(id))
  await updateProductIds(newIds)
  selectedLinked.value = []
}

// Load products when dialog opens
watch(showDialog, (visible) => {
  if (visible) {
    loadAllProducts()
    selectedUnlinked.value = []
    selectedLinked.value = []
    searchUnlinked.value = ''
    searchLinked.value = ''
  }
})

// Load products on mount for the preview card
loadAllProducts()
</script>
