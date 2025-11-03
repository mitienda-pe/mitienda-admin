<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { productsApi } from '@/api/products.api'
import type { Product } from '@/types/product.types'

interface Props {
  visible: boolean
  promotionId: number | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'linked', products: Array<{ producto_id: number }>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoading = ref(false)
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
      page: 1
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

function handleLinkProducts() {
  if (selectedProducts.value.length === 0) {
    return
  }

  const productIds = selectedProducts.value.map(p => ({
    producto_id: p.id
  }))

  emit('linked', productIds)
  handleClose()
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
      <div v-if="products.length > 0" class="border rounded-lg">
        <DataTable
          v-model:selection="selectedProducts"
          :value="products"
          dataKey="id"
          :paginator="false"
          class="text-sm"
        >
          <Column selectionMode="multiple" style="width: 3rem"></Column>
          <Column header="Producto" style="min-width: 300px">
            <template #body="slotProps">
              <div class="flex items-center gap-3">
                <img
                  v-if="slotProps.data.main_image"
                  :src="`https://cdn.mitienda.pe/images/${slotProps.data.main_image}`"
                  :alt="slotProps.data.title"
                  class="w-10 h-10 rounded object-cover"
                />
                <div>
                  <div class="font-medium">{{ slotProps.data.title }}</div>
                  <div class="text-gray-500 text-xs">SKU: {{ slotProps.data.sku }}</div>
                </div>
              </div>
            </template>
          </Column>
          <Column field="price" header="Precio">
            <template #body="slotProps">
              S/ {{ slotProps.data.price }}
            </template>
          </Column>
          <Column header="Stock">
            <template #body="slotProps">
              {{ slotProps.data.unlimited_stock ? 'Ilimitado' : slotProps.data.stock }}
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
        />
        <Button
          label="Vincular Productos"
          @click="handleLinkProducts"
          :disabled="selectedProducts.length === 0"
        />
      </div>
    </template>
  </Dialog>
</template>
