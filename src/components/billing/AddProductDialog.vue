<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { billingApi } from '@/api/billing.api'
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select', product: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { formatCurrency } = useFormatters()

const searchQuery = ref('')
const products = ref<any[]>([])
const isLoading = ref(false)
const selectedProduct = ref<any>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Watch for dialog open/close
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // Reset state when dialog opens
    searchQuery.value = ''
    products.value = []
    selectedProduct.value = null
  }
})

// Search products
async function searchProducts() {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    products.value = []
    return
  }

  isLoading.value = true
  try {
    const response = await billingApi.searchProducts(searchQuery.value, 20)
    if (response.success && response.data) {
      products.value = response.data
    } else {
      products.value = []
    }
  } catch (error) {
    console.error('Error searching products:', error)
    products.value = []
  } finally {
    isLoading.value = false
  }
}

// Handle search input with debounce
function onSearchInput(value: string) {
  searchQuery.value = value
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchProducts()
  }, 300)
}

// Handle product selection
function onRowSelect(event: any) {
  emit('select', event.data)
  emit('update:visible', false)
}

// Handle double click
function onRowDblClick(event: any) {
  emit('select', event.data)
  emit('update:visible', false)
}

// Handle cancel
function onCancel() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Agregar Producto del Catálogo"
    :modal="true"
    :closable="true"
    :style="{ width: '700px', maxHeight: '80vh' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <!-- Search Input -->
      <div class="flex gap-2">
        <span class="p-input-icon-left flex-1">
          <i class="pi pi-search" />
          <InputText
            :modelValue="searchQuery"
            placeholder="Buscar por nombre, SKU..."
            class="w-full"
            autofocus
            @update:modelValue="onSearchInput"
          />
        </span>
      </div>

      <!-- Loading Spinner -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <!-- Results Table -->
      <div v-else-if="products.length > 0" class="max-h-96 overflow-auto">
        <DataTable
          :value="products"
          v-model:selection="selectedProduct"
          selectionMode="single"
          dataKey="id"
          :metaKeySelection="false"
          class="p-datatable-sm"
          @row-select="onRowSelect"
          @row-dblclick="onRowDblClick"
          responsiveLayout="scroll"
        >
          <Column field="sku" header="SKU" style="width: 100px">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.sku || '-' }}</span>
            </template>
          </Column>
          <Column field="name" header="Nombre" style="min-width: 200px">
            <template #body="{ data }">
              <span>{{ data.name || data.title }}</span>
            </template>
          </Column>
          <Column field="price" header="Precio" style="width: 100px">
            <template #body="{ data }">
              <span class="font-mono">{{ formatCurrency(data.price) }}</span>
            </template>
          </Column>
          <Column field="stock" header="Stock" style="width: 80px">
            <template #body="{ data }">
              <span :class="data.stock > 0 ? 'text-green-600' : 'text-red-600'">
                {{ data.stock ?? '-' }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Empty State -->
      <div v-else-if="searchQuery.length >= 2" class="text-center py-8 text-gray-500">
        <i class="pi pi-search text-4xl mb-2"></i>
        <p>No se encontraron productos</p>
      </div>

      <!-- Initial State -->
      <div v-else class="text-center py-8 text-gray-500">
        <i class="pi pi-box text-4xl mb-2"></i>
        <p>Escriba al menos 2 caracteres para buscar productos</p>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="onCancel" />
    </template>
  </Dialog>
</template>
