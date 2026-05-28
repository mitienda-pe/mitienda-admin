<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">Stock y precios en NetSuite</h1>
        <p class="text-secondary-600 mt-1">Comparación de stock y precios entre MiTienda y NetSuite, con sincronización manual.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          label="Sincronizar stock"
          icon="pi pi-cloud-download"
          severity="secondary"
          outlined
          :loading="syncingStock"
          :disabled="syncingPrices || syncingProducts"
          @click="onSyncTiendaStock"
        />
        <Button
          label="Sincronizar precios"
          icon="pi pi-dollar"
          severity="secondary"
          outlined
          :loading="syncingPrices"
          :disabled="syncingStock || syncingProducts"
          @click="onSyncTiendaPrices"
        />
        <Button
          label="Importar productos nuevos"
          icon="pi pi-plus-circle"
          severity="primary"
          outlined
          :loading="syncingProducts"
          :disabled="syncingStock || syncingPrices"
          @click="onPreviewSyncProducts"
        />
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          :loading="isLoading"
          @click="loadStock"
        />
      </div>
    </div>

    <!-- Sync result -->
    <Message v-if="lastSyncMessage" :severity="lastSyncSeverity" @close="lastSyncMessage = ''">
      {{ lastSyncMessage }}
    </Message>

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
        <div class="flex items-center gap-4 text-sm flex-wrap">
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
                @keyup.enter="pagination.page = 1; loadStock()"
              />
            </span>
          </div>
          <Button
            label="Buscar"
            icon="pi pi-search"
            :loading="isLoading"
            @click="pagination.page = 1; loadStock()"
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

          <Column field="sku" header="SKU" :sortable="true" style="min-width: 110px">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.sku }}</span>
            </template>
          </Column>

          <Column field="product_name" header="Producto" :sortable="true" style="min-width: 240px">
            <template #body="{ data }">
              <span class="text-sm">{{ data.product_name }}</span>
            </template>
          </Column>

          <Column field="local_stock" header="Stock MiTienda" :sortable="true" style="min-width: 110px" class="text-right">
            <template #body="{ data }">
              <span class="font-semibold">{{ data.local_stock }}</span>
            </template>
          </Column>

          <Column field="netsuite_stock" header="Stock NetSuite" :sortable="true" style="min-width: 110px" class="text-right">
            <template #body="{ data }">
              <span v-if="data.netsuite_stock !== null" class="font-semibold">
                {{ data.netsuite_stock }}
              </span>
              <span v-else class="text-secondary-400 italic">N/A</span>
            </template>
          </Column>

          <Column header="Δ Stock" style="min-width: 100px" class="text-center">
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
              <Tag v-else-if="data.stock_match" severity="success" value="Igual" />
              <Tag v-else severity="warning" :value="getStockDiff(data)" />
            </template>
          </Column>

          <Column field="local_price" header="Precio MiTienda" :sortable="true" style="min-width: 120px" class="text-right">
            <template #body="{ data }">
              <span class="font-semibold">{{ formatMoney(data.local_price) }}</span>
            </template>
          </Column>

          <Column field="netsuite_price" header="Precio NetSuite" :sortable="true" style="min-width: 120px" class="text-right">
            <template #body="{ data }">
              <span v-if="data.netsuite_price !== null" class="font-semibold">
                {{ formatMoney(data.netsuite_price) }}
              </span>
              <span v-else class="text-secondary-400 italic">N/A</span>
            </template>
          </Column>

          <Column header="Δ Precio" style="min-width: 100px" class="text-center">
            <template #body="{ data }">
              <Tag v-if="data.netsuite_price === null" severity="secondary" value="N/A" />
              <Tag v-else-if="data.price_match" severity="success" value="Igual" />
              <Tag v-else severity="warning" :value="formatMoney(data.netsuite_price - data.local_price)" />
            </template>
          </Column>
        </DataTable>

        <!-- Import products preview dialog -->
        <Dialog
          v-model:visible="showImportPreview"
          modal
          header="Importar productos nuevos desde NetSuite"
          :style="{ width: '90vw', maxWidth: '1100px' }"
          :closable="!importExecuting"
        >
          <div class="space-y-3">
            <Message v-if="importPreviewError" severity="error" :closable="false">
              {{ importPreviewError }}
            </Message>

            <div v-if="importPreviewData && !importPreviewError">
              <div class="flex flex-wrap gap-3 text-sm text-secondary-700 mb-3">
                <Tag :value="`Items NetSuite: ${importPreviewData.data.total_from_netsuite}`" severity="info" />
                <Tag :value="`Candidatos nuevos: ${importPreviewData.data.total_candidates}`" severity="success" />
                <Tag :value="`Ya existen en MiTienda: ${importPreviewData.data.skipped.length}`" severity="secondary" />
              </div>

              <p class="text-sm text-secondary-600 mb-3">
                Filtros: types <code class="text-xs">{{ importPreviewData.data.filters.itemtypes.join(',') }}</code>,
                clases excluidas <code class="text-xs">{{ importPreviewData.data.filters.excluded_classes.join(',') || 'ninguna' }}</code>,
                location <code class="text-xs">{{ importPreviewData.data.filters.location_id ?? 'sin filtro' }}</code>,
                price level <code class="text-xs">{{ importPreviewData.data.filters.price_level_id }}</code>.
              </p>

              <DataTable
                :value="previewCandidates"
                striped-rows
                class="p-datatable-sm"
                scroll-height="50vh"
                scrollable
              >
                <template #empty>
                  <div class="text-center py-6 text-secondary-500">
                    <i class="pi pi-check-circle text-3xl mb-3 block text-green-500"></i>
                    <p>No hay productos nuevos en NetSuite para importar.</p>
                  </div>
                </template>
                <Column field="netsuite_item_id" header="Item.ID" style="min-width: 90px">
                  <template #body="{ data }"><span class="font-mono text-xs">{{ data.netsuite_item_id }}</span></template>
                </Column>
                <Column header="SKU NetSuite" style="min-width: 120px">
                  <template #body="{ data }"><span class="font-mono text-xs">{{ data.source?.ns_sku ?? '—' }}</span></template>
                </Column>
                <Column header="Título a crear" style="min-width: 280px">
                  <template #body="{ data }"><span class="text-sm">{{ data.preview?.producto_titulo ?? '—' }}</span></template>
                </Column>
                <Column header="Tipo" style="min-width: 90px">
                  <template #body="{ data }"><Tag severity="secondary" :value="data.source?.item_type ?? '—'" /></template>
                </Column>
                <Column header="Class" style="min-width: 80px">
                  <template #body="{ data }"><span class="font-mono text-xs">{{ data.source?.class ?? '—' }}</span></template>
                </Column>
                <Column header="Precio" style="min-width: 110px" class="text-right">
                  <template #body="{ data }">
                    <span class="font-semibold">S/ {{ Number(data.preview?.producto_precio ?? 0).toFixed(2) }}</span>
                  </template>
                </Column>
                <Column header="Stock" style="min-width: 80px" class="text-right">
                  <template #body="{ data }"><span class="font-semibold">{{ data.preview?.producto_stock ?? 0 }}</span></template>
                </Column>
                <Column header="Barcode" style="min-width: 130px">
                  <template #body="{ data }">
                    <span v-if="data.preview?.producto_barcode" class="font-mono text-xs">{{ data.preview.producto_barcode }}</span>
                    <span v-else class="text-secondary-400 italic text-xs">sin UPC</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>

          <template #footer>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              text
              :disabled="importExecuting"
              @click="showImportPreview = false"
            />
            <Button
              v-if="previewCandidates.length > 0"
              :label="`Importar ${previewCandidates.length} producto${previewCandidates.length === 1 ? '' : 's'}`"
              icon="pi pi-check"
              severity="primary"
              :loading="importExecuting"
              @click="onConfirmSyncProducts"
            />
          </template>
        </Dialog>

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
import { ref, computed, onMounted } from 'vue'
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
import Dialog from 'primevue/dialog'

const toast = useToast()

interface ProductStock {
  product_id: number
  sku: string
  product_name: string
  netsuite_item_id: string
  local_stock: number
  netsuite_stock: number | null
  stock_match: boolean
  local_price: number
  local_price_without_igv: number
  netsuite_price: number | null
  netsuite_price_without_igv: number | null
  price_match: boolean
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
const syncingStock = ref(false)
const syncingPrices = ref(false)
const syncingProducts = ref(false)
const lastSyncMessage = ref('')
const lastSyncSeverity = ref<'success' | 'warn' | 'error'>('success')

// Import products preview modal state
const showImportPreview = ref(false)
const importPreviewData = ref<Awaited<ReturnType<typeof netsuiteApi.syncTiendaProducts>> | null>(null)
const importPreviewError = ref<string | null>(null)
const importExecuting = ref(false)

const previewCandidates = computed(() =>
  importPreviewData.value?.data?.items?.filter(i => i.status === 'dry_run') ?? []
)

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
  if (data.netsuite_stock === null || data.netsuite_stock === undefined) return 'N/A'
  const ns = Number(data.netsuite_stock)
  const local = Number(data.local_stock)
  if (isNaN(ns) || isNaN(local)) return 'N/A'
  const diff = ns - local
  if (diff > 0) return `+${diff}`
  return diff.toString()
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A'
  return `S/ ${Number(value).toFixed(2)}`
}

async function queryIndividualStock(product: ProductStock) {
  loadingProductId.value = product.product_id

  try {
    const response = await netsuiteApi.getProductNetsuiteStock(product.product_id)

    if (response.success && response.data) {
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

async function onSyncTiendaStock() {
  syncingStock.value = true
  lastSyncMessage.value = ''
  try {
    const res = await netsuiteApi.syncTiendaStock(false)
    const stats = res?.data?.stats || res?.data || {}
    const updated = stats.updated_count ?? stats.updated ?? 0
    const errors = stats.errors_count ?? (Array.isArray(stats.errors) ? stats.errors.length : 0)
    lastSyncSeverity.value = errors > 0 ? 'warn' : 'success'
    lastSyncMessage.value = `Sincronización de stock completada: ${updated} actualizado(s)${errors > 0 ? `, ${errors} error(es)` : ''}.`
    toast.add({ severity: lastSyncSeverity.value, summary: 'Stock', detail: lastSyncMessage.value, life: 4000 })
    await loadStock()
  } catch (err: any) {
    console.error('Error sync tienda stock:', err)
    lastSyncSeverity.value = 'error'
    lastSyncMessage.value = err?.response?.data?.messages?.error
      || err?.response?.data?.error
      || err?.message
      || 'Error sincronizando stock de la tienda'
    toast.add({ severity: 'error', summary: 'Error', detail: lastSyncMessage.value, life: 6000 })
  } finally {
    syncingStock.value = false
  }
}

async function onSyncTiendaPrices() {
  syncingPrices.value = true
  lastSyncMessage.value = ''
  try {
    const res = await netsuiteApi.syncTiendaPrices(false)
    const stats = res?.data || {}
    const updated = stats.updated_count ?? 0
    const created = stats.created_count ?? 0
    const errors = Array.isArray(stats.errors) ? stats.errors.length : 0
    lastSyncSeverity.value = errors > 0 ? 'warn' : 'success'
    lastSyncMessage.value = `Sincronización de precios completada: ${updated} actualizado(s)${created > 0 ? `, ${created} producto(s) nuevo(s)` : ''}${errors > 0 ? `, ${errors} error(es)` : ''}.`
    toast.add({ severity: lastSyncSeverity.value, summary: 'Precios', detail: lastSyncMessage.value, life: 4000 })
    await loadStock()
  } catch (err: any) {
    console.error('Error sync tienda prices:', err)
    lastSyncSeverity.value = 'error'
    lastSyncMessage.value = err?.response?.data?.messages?.error
      || err?.response?.data?.error
      || err?.message
      || 'Error sincronizando precios de la tienda'
    toast.add({ severity: 'error', summary: 'Error', detail: lastSyncMessage.value, life: 6000 })
  } finally {
    syncingPrices.value = false
  }
}

async function onPreviewSyncProducts() {
  syncingProducts.value = true
  importPreviewError.value = null
  importPreviewData.value = null
  showImportPreview.value = true
  try {
    const res = await netsuiteApi.syncTiendaProducts(true)
    importPreviewData.value = res
  } catch (err: any) {
    console.error('Error preview sync products:', err)
    importPreviewError.value = err?.response?.data?.messages?.error
      || err?.response?.data?.error
      || err?.message
      || 'Error consultando productos nuevos en NetSuite'
  } finally {
    syncingProducts.value = false
  }
}

async function onConfirmSyncProducts() {
  importExecuting.value = true
  try {
    const res = await netsuiteApi.syncTiendaProducts(false)
    const data = res?.data
    const created = data?.created ?? 0
    const errors = data?.errors ?? 0
    const skipped = (data?.skipped_duplicate ?? 0) + (data?.skipped_missing_data ?? 0)

    lastSyncSeverity.value = errors > 0 ? 'warn' : 'success'
    lastSyncMessage.value = `Importación completada: ${created} producto(s) creado(s)`
      + (skipped > 0 ? `, ${skipped} omitido(s)` : '')
      + (errors > 0 ? `, ${errors} error(es)` : '')
      + '.'

    toast.add({
      severity: lastSyncSeverity.value,
      summary: 'Productos',
      detail: lastSyncMessage.value,
      life: 5000,
    })
    showImportPreview.value = false
    importPreviewData.value = null
    await loadStock()
  } catch (err: any) {
    console.error('Error executing sync products:', err)
    const msg = err?.response?.data?.messages?.error
      || err?.response?.data?.error
      || err?.message
      || 'Error importando productos desde NetSuite'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 6000 })
  } finally {
    importExecuting.value = false
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
