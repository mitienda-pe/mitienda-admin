<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">Stock en NetSuite</h1>
        <p class="text-secondary-600 mt-1">Consulta el stock de productos en el location configurado de NetSuite</p>
      </div>
      <Button
        label="Actualizar"
        icon="pi pi-refresh"
        :loading="isLoading"
        @click="loadStock"
      />
    </div>

    <!-- Error state -->
    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <!-- NetSuite error (partial data) -->
    <Message v-if="netsuiteError && !error" severity="warn" :closable="false">
      <span class="font-semibold">Advertencia de NetSuite:</span> {{ netsuiteError }}
    </Message>

    <!-- Info Card -->
    <Card v-if="locationId">
      <template #content>
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <i class="pi pi-map-marker text-primary"></i>
            <span class="text-secondary-600">Location ID:</span>
            <span class="font-mono font-semibold">{{ locationId }}</span>
          </div>
          <div v-if="checkedAt" class="flex items-center gap-2">
            <i class="pi pi-clock text-secondary-400"></i>
            <span class="text-secondary-600">Consultado:</span>
            <span class="font-semibold">{{ checkedAt }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-box text-secondary-400"></i>
            <span class="text-secondary-600">Productos mapeados:</span>
            <span class="font-semibold">{{ pagination.total }}</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Search and filters -->
    <Card>
      <template #content>
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por SKU o nombre..."
                class="w-full"
                @keyup.enter="loadStock"
              />
            </span>
          </div>
          <Button
            label="Buscar"
            icon="pi pi-search"
            :loading="isLoading"
            @click="loadStock"
          />
        </div>
      </template>
    </Card>

    <!-- Data Table -->
    <Card>
      <template #content>
        <DataTable
          :value="products"
          :loading="isLoading"
          striped-rows
          responsive-layout="scroll"
          class="p-datatable-sm"
        >
          <template #empty>
            <div class="text-center py-8 text-secondary-500">
              <i class="pi pi-inbox text-4xl mb-4 block"></i>
              <p>No hay productos mapeados con NetSuite</p>
              <p class="text-sm mt-2">
                <router-link to="/configuracion/netsuite/inventario" class="text-primary hover:underline">
                  Ir a mapeo de inventario
                </router-link>
              </p>
            </div>
          </template>

          <Column field="sku" header="SKU" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.sku }}</span>
            </template>
          </Column>

          <Column field="product_name" header="Producto" :sortable="true" style="min-width: 250px">
            <template #body="{ data }">
              <span class="text-sm">{{ data.product_name }}</span>
            </template>
          </Column>

          <Column field="netsuite_item_id" header="NS Item ID" style="min-width: 100px">
            <template #body="{ data }">
              <span class="font-mono text-sm text-secondary-500">{{ data.netsuite_item_id }}</span>
            </template>
          </Column>

          <Column field="local_stock" header="Stock Local" :sortable="true" style="min-width: 100px" class="text-right">
            <template #body="{ data }">
              <span class="font-semibold">{{ data.local_stock }}</span>
            </template>
          </Column>

          <Column field="netsuite_stock" header="Stock NetSuite" :sortable="true" style="min-width: 120px" class="text-right">
            <template #body="{ data }">
              <span v-if="data.netsuite_stock !== null" class="font-semibold">
                {{ data.netsuite_stock }}
              </span>
              <span v-else class="text-secondary-400 italic">N/A</span>
            </template>
          </Column>

          <Column header="Estado" style="min-width: 120px" class="text-center">
            <template #body="{ data }">
              <Button
                v-if="data.netsuite_stock === null"
                label="Consultar"
                icon="pi pi-search"
                size="small"
                severity="secondary"
                :loading="loadingProductId === data.product_id"
                @click="queryIndividualStock(data)"
              />
              <Tag
                v-else-if="data.stock_match"
                severity="success"
                value="Igual"
              />
              <Tag
                v-else
                severity="warning"
                :value="getStockDiff(data)"
              />
            </template>
          </Column>
        </DataTable>

        <!-- Pagination -->
        <div v-if="pagination.pages > 1" class="flex items-center justify-between mt-4 pt-4 border-t">
          <span class="text-sm text-secondary-600">
            Mostrando {{ (pagination.page - 1) * pagination.limit + 1 }} -
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
            de {{ pagination.total }} productos
          </span>
          <Paginator
            :rows="pagination.limit"
            :total-records="pagination.total"
            :first="(pagination.page - 1) * pagination.limit"
            :rows-per-page-options="[25, 50, 100]"
            @page="onPageChange"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { netsuiteApi } from '@/api/netsuite.api'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import Message from 'primevue/message'

const toast = useToast()

interface ProductStock {
  product_id: number
  sku: string
  product_name: string
  netsuite_item_id: string
  local_stock: number
  netsuite_stock: number | null
  stock_match: boolean
}

const products = ref<ProductStock[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const netsuiteError = ref<string | null>(null)
const searchQuery = ref('')
const locationId = ref<number | null>(null)
const checkedAt = ref<string | null>(null)

const pagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  pages: 0
})

const loadingProductId = ref<number | null>(null)

async function loadStock() {
  isLoading.value = true
  error.value = null
  netsuiteError.value = null

  try {
    const response = await netsuiteApi.getNetsuiteStockList({
      search: searchQuery.value || undefined,
      page: pagination.value.page,
      limit: pagination.value.limit
    })

    if (response.success || response.data) {
      products.value = response.data || []
      pagination.value = response.pagination || pagination.value
      locationId.value = response.location_id || null
      checkedAt.value = response.checked_at || null
      netsuiteError.value = response.netsuite_error || null
    } else {
      error.value = response.message || 'Error desconocido'
    }
  } catch (err: any) {
    console.error('Error loading NetSuite stock:', err)
    error.value = err.response?.data?.messages?.error || err.message || 'Error consultando stock'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.value,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

function onPageChange(event: { page: number; rows: number }) {
  pagination.value.page = event.page + 1
  pagination.value.limit = event.rows
  loadStock()
}

function getStockDiff(data: ProductStock): string {
  if (data.netsuite_stock === null) return 'N/A'
  const diff = data.netsuite_stock - data.local_stock
  if (diff > 0) return `+${diff}`
  return diff.toString()
}

async function queryIndividualStock(product: ProductStock) {
  loadingProductId.value = product.product_id

  try {
    const response = await netsuiteApi.getProductNetsuiteStock(product.product_id)

    if (response.success && response.data) {
      // Actualizar el producto en la lista
      const index = products.value.findIndex(p => p.product_id === product.product_id)
      if (index !== -1) {
        const netsuiteStock = response.data.netsuite_stock
        products.value[index] = {
          ...products.value[index],
          netsuite_stock: netsuiteStock,
          stock_match: netsuiteStock !== null && products.value[index].local_stock === netsuiteStock
        }
      }
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Sin stock',
        detail: `No se encontró stock en NetSuite para ${product.sku}`,
        life: 3000
      })
    }
  } catch (err: any) {
    console.error('Error querying individual stock:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error consultando stock',
      life: 5000
    })
  } finally {
    loadingProductId.value = null
  }
}

onMounted(() => {
  loadStock()
})
</script>

<style scoped>
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem 1rem;
}

:deep(.p-input-icon-left > i:first-of-type) {
  left: 0.75rem;
  color: #9ca3af;
}

:deep(.p-input-icon-left > .p-inputtext) {
  padding-left: 2.5rem;
}
</style>
