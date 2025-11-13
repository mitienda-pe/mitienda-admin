<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { productsApi } from '@/api/products.api'
import type { Product } from '@/types/product.types'
import { usePromotionsStore } from '@/stores/promotions.store'

interface Props {
  visible: boolean
  promotionId: number | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'linked'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const promotionsStore = usePromotionsStore()

const isLoading = ref(false)
const isLinking = ref(false)
const searchQuery = ref('')
const products = ref<Product[]>([])
const selectedProducts = ref<Product[]>([])

// Search products
async function searchProducts() {
  if (!searchQuery.value.trim()) {
    products.value = []
    return
  }

  try {
    isLoading.value = true
    const response = await productsApi.getProducts({
      search: searchQuery.value,
      limit: 50,
      page: 1,
      published: true,
      stock_status: 'in_stock'
    })

    if (response.success && response.data) {
      products.value = response.data
    }
  } catch (error) {
    console.error('Error searching products:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleLinkProducts() {
  if (selectedProducts.value.length === 0 || !props.promotionId) {
    return
  }

  try {
    isLinking.value = true

    const productIds = selectedProducts.value.map(p => ({
      producto_id: p.id
    }))

    await promotionsStore.linkProducts(props.promotionId, productIds)

    emit('linked')
    handleClose()
  } catch (error) {
    console.error('Error linking products:', error)
  } finally {
    isLinking.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
  // Reset
  searchQuery.value = ''
  products.value = []
  selectedProducts.value = []
}

// Watch visible prop
watch(() => props.visible, (isVisible) => {
  if (!isVisible) {
    // Reset when closing
    searchQuery.value = ''
    products.value = []
    selectedProducts.value = []
  }
})
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    header="Vincular Productos"
    class="w-full md:w-[800px]"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
      <!-- Search -->
      <div class="flex gap-2">
        <InputText
          v-model="searchQuery"
          placeholder="Buscar productos por nombre, SKU o código de barras..."
          class="flex-1"
          @keyup.enter="searchProducts"
        />
        <Button
          label="Buscar"
          icon="pi pi-search"
          @click="searchProducts"
          :loading="isLoading"
        />
      </div>

      <!-- Results -->
      <div v-if="products.length > 0" class="border rounded-lg overflow-hidden">
        <DataTable
          v-model:selection="selectedProducts"
          :value="products"
          dataKey="id"
          :paginator="false"
          showGridlines
          stripedRows
          class="text-sm"
        >
          <Column selectionMode="multiple" headerStyle="width: 4rem; padding: 1rem" bodyStyle="padding: 1rem">
            <template #header>
              <span class="sr-only">Seleccionar</span>
            </template>
          </Column>
          <Column header="Producto" headerStyle="min-width: 300px; padding: 1rem" bodyStyle="padding: 1rem">
            <template #body="slotProps">
              <div class="flex items-center gap-3">
                <img
                  v-if="slotProps.data.images && slotProps.data.images.length > 0"
                  :src="slotProps.data.images[0].cloudflare_url || slotProps.data.images[0].url"
                  :alt="slotProps.data.name"
                  class="w-12 h-12 rounded object-cover flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 truncate">{{ slotProps.data.name }}</div>
                  <div class="text-gray-500 text-xs mt-0.5">SKU: {{ slotProps.data.sku }}</div>
                </div>
              </div>
            </template>
          </Column>
          <Column field="price" header="Precio" headerStyle="width: 120px; padding: 1rem" bodyStyle="padding: 1rem">
            <template #body="slotProps">
              <span class="font-medium text-gray-900">S/ {{ Number(slotProps.data.price).toFixed(2) }}</span>
            </template>
          </Column>
          <Column header="Stock" headerStyle="width: 120px; padding: 1rem" bodyStyle="padding: 1rem">
            <template #body="slotProps">
              <span :class="slotProps.data.unlimited_stock ? 'text-green-600' : 'text-gray-900'">
                {{ slotProps.data.unlimited_stock ? 'Ilimitado' : slotProps.data.stock }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Empty state -->
      <div v-else-if="searchQuery && !isLoading" class="text-center py-8 text-gray-500">
        <i class="pi pi-search text-4xl mb-2"></i>
        <p>No se encontraron productos</p>
        <p class="text-sm">Intenta con otro término de búsqueda</p>
      </div>

      <!-- Initial state -->
      <div v-else-if="!searchQuery" class="text-center py-8 text-gray-500">
        <i class="pi pi-box text-4xl mb-2"></i>
        <p>Busca productos para vincular a esta promoción</p>
      </div>

      <!-- Selected count -->
      <div v-if="selectedProducts.length > 0" class="text-sm text-gray-700">
        {{ selectedProducts.length }} producto(s) seleccionado(s)
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
          :disabled="isLinking"
        />
        <Button
          label="Vincular Productos"
          @click="handleLinkProducts"
          :disabled="selectedProducts.length === 0"
          :loading="isLinking"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* Mejorar la visualización de los checkboxes */
:deep(.p-datatable .p-checkbox) {
  width: 1.25rem;
  height: 1.25rem;
}

:deep(.p-datatable .p-checkbox .p-checkbox-box) {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #d1d5db;
  border-radius: 0.25rem;
  background-color: white;
}

:deep(.p-datatable .p-checkbox .p-checkbox-box.p-highlight) {
  border-color: #4f46e5;
  background-color: #4f46e5;
}

:deep(.p-datatable .p-checkbox .p-checkbox-box .p-checkbox-icon) {
  width: 0.75rem;
  height: 0.75rem;
  color: white;
}

/* Mejorar el hover en las filas */
:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f9fafb !important;
}

/* Asegurar que los checkboxes sean visibles */
:deep(.p-datatable .p-selection-column) {
  text-align: center;
  vertical-align: middle;
}
</style>
