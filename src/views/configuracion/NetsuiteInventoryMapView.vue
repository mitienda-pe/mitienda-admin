<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-secondary-800">Mapeo de Inventario NetSuite</h1>
      <p class="text-secondary-600 mt-1">Gestiona el mapeo de productos de miTienda con items e inventory numbers de NetSuite</p>
    </div>

    <!-- Loading state -->
    <div v-if="!currentTiendaId" class="flex items-center justify-center py-12">
      <Message severity="warn" :closable="false">
        No se ha seleccionado ninguna tienda. Por favor, seleccione una tienda para continuar.
      </Message>
    </div>

    <!-- Content -->
    <div v-else class="space-y-4">
      <!-- Filters Card -->
      <Card>
        <template #content>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Search -->
              <div class="md:col-span-2">
                <IconField iconPosition="left">
                  <InputIcon>
                    <i class="pi pi-search" />
                  </InputIcon>
                  <InputText
                    v-model="filters.search"
                    placeholder="Buscar por SKU o nombre de producto..."
                    class="w-full"
                    @input="onSearchChange"
                  />
                </IconField>
              </div>

              <!-- Mapping Filter -->
              <div>
                <Dropdown
                  v-model="filters.has_mapping"
                  :options="mappingFilterOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Estado de mapeo"
                  class="w-full"
                  @change="loadProducts"
                />
              </div>
            </div>

            <!-- CSV Upload Button -->
            <div class="flex justify-end">
              <Button
                label="Importar Lotes"
                icon="pi pi-upload"
                severity="secondary"
                @click="csvUploadDialogVisible = true"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Products Table -->
      <Card>
        <template #content>
          <DataTable
            :value="products"
            :loading="loading"
            stripedRows
            showGridlines
            dataKey="tiendaproducto_id"
            :paginator="true"
            :rows="pagination.limit"
            :totalRecords="pagination.total"
            :lazy="true"
            @page="onPageChange"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
            :rowsPerPageOptions="[10, 25, 50]"
          >
            <!-- Empty state -->
            <template #empty>
              <div class="text-center py-8">
                <i class="pi pi-inbox text-4xl text-secondary-400 mb-3"></i>
                <p class="text-secondary-600">No se encontraron productos activos</p>
              </div>
            </template>

            <!-- SKU Column -->
            <Column field="tiendaproducto_sku" header="SKU" style="width: 150px">
              <template #body="{ data }">
                <span class="font-mono text-sm">{{ data.tiendaproducto_sku || '-' }}</span>
              </template>
            </Column>

            <!-- Product Name Column -->
            <Column field="tiendaproducto_titulo" header="Producto" style="min-width: 300px">
              <template #body="{ data }">
                <div>
                  <p class="font-medium text-secondary-900">{{ data.tiendaproducto_titulo }}</p>
                </div>
              </template>
            </Column>

            <!-- NetSuite Item ID Column -->
            <Column header="NetSuite Item ID" style="width: 180px">
              <template #body="{ data }">
                <Tag
                  v-if="data.netsuite_item_id"
                  :value="data.netsuite_item_id"
                  severity="success"
                  class="font-mono"
                />
                <Tag v-else value="Sin mapear" severity="warning" />
              </template>
            </Column>

            <!-- Inventory Numbers Column -->
            <Column header="Inventory Numbers" style="min-width: 250px">
              <template #body="{ data }">
                <div v-if="data.inventory_numbers && data.inventory_numbers.length > 0" class="space-y-1">
                  <div
                    v-for="invNum in data.inventory_numbers.slice(0, 2)"
                    :key="invNum.id"
                    class="text-xs"
                  >
                    <span class="font-mono text-secondary-700">{{ invNum.lot_number }}</span>
                    <span class="text-secondary-500"> (ID: {{ invNum.inventory_number_id }})</span>
                  </div>
                  <span
                    v-if="data.inventory_numbers.length > 2"
                    class="text-xs text-secondary-500"
                  >
                    +{{ data.inventory_numbers.length - 2 }} más
                  </span>
                </div>
                <span v-else class="text-sm text-secondary-500">Sin lotes</span>
              </template>
            </Column>

            <!-- Actions Column -->
            <Column header="Acciones" style="width: 120px">
              <template #body="{ data }">
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  @click="openEditDialog(data)"
                  v-tooltip.top="'Editar mapeo'"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      :header="`Mapear: ${selectedProduct?.tiendaproducto_titulo}`"
      :modal="true"
      :closable="true"
      :dismissableMask="false"
      :style="{ width: '800px' }"
      @hide="onDialogClose"
    >
      <div v-if="selectedProduct" class="space-y-6">
        <!-- Product Info -->
        <div class="bg-secondary-50 p-4 rounded-lg">
          <h3 class="font-semibold text-secondary-900">{{ selectedProduct.tiendaproducto_titulo }}</h3>
          <p class="text-sm text-secondary-600 mt-1">
            <span class="font-medium">SKU:</span> {{ selectedProduct.tiendaproducto_sku || 'Sin SKU' }}
          </p>
        </div>

        <!-- NetSuite Item ID -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            NetSuite Item ID
            <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="editForm.netsuite_item_id"
            placeholder="Ej: 7544"
            class="w-full"
            :class="{ 'p-invalid': editFormErrors.netsuite_item_id }"
          />
          <small v-if="editFormErrors.netsuite_item_id" class="p-error">
            {{ editFormErrors.netsuite_item_id }}
          </small>
          <small class="text-secondary-500 block mt-1">
            El ID interno del item en NetSuite. Este valor también se guardará en el SKU del producto.
          </small>
        </div>

        <Divider />

        <!-- Inventory Numbers Section -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-semibold text-secondary-900">Inventory Numbers (Lotes)</h4>
            <Button
              label="Agregar Lote"
              icon="pi pi-plus"
              size="small"
              @click="addInventoryNumber"
            />
          </div>

          <!-- Inventory Numbers List -->
          <div v-if="editForm.inventory_numbers.length > 0" class="space-y-3">
            <Card
              v-for="(invNum, index) in editForm.inventory_numbers"
              :key="index"
              class="border"
            >
              <template #content>
                <div class="grid grid-cols-12 gap-3">
                  <!-- Lot Number -->
                  <div class="col-span-4">
                    <label class="block text-xs font-medium text-secondary-700 mb-1">
                      Lot Number
                    </label>
                    <InputText
                      v-model="invNum.lot_number"
                      placeholder="Ej: L06MAY26"
                      size="small"
                      class="w-full"
                    />
                  </div>

                  <!-- Inventory Number ID -->
                  <div class="col-span-3">
                    <label class="block text-xs font-medium text-secondary-700 mb-1">
                      Inv. Number ID
                    </label>
                    <InputNumber
                      v-model="invNum.inventory_number_id"
                      placeholder="11039"
                      size="small"
                      class="w-full"
                      :useGrouping="false"
                    />
                  </div>

                  <!-- Location ID -->
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-secondary-700 mb-1">
                      Location
                    </label>
                    <InputNumber
                      v-model="invNum.location_id"
                      size="small"
                      class="w-full"
                      :useGrouping="false"
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-secondary-700 mb-1">
                      Stock
                    </label>
                    <InputNumber
                      v-model="invNum.quantity_available"
                      size="small"
                      class="w-full"
                      :useGrouping="false"
                      :minFractionDigits="0"
                      :maxFractionDigits="2"
                    />
                  </div>

                  <!-- Delete Button -->
                  <div class="col-span-1 flex items-end justify-center">
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      @click="removeInventoryNumber(index)"
                      v-tooltip.top="'Eliminar'"
                    />
                  </div>
                </div>
              </template>
            </Card>
          </div>

          <!-- Empty state -->
          <div v-else class="text-center py-6 bg-secondary-50 rounded-lg">
            <i class="pi pi-inbox text-3xl text-secondary-400 mb-2"></i>
            <p class="text-secondary-600 text-sm">No hay inventory numbers configurados</p>
            <p class="text-secondary-500 text-xs mt-1">Haz clic en "Agregar Lote" para comenzar</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="editDialogVisible = false" />
        <Button
          label="Guardar"
          :loading="saving"
          @click="saveProductMapping"
        />
      </template>
    </Dialog>

    <!-- CSV Upload Dialog -->
    <Dialog
      v-model:visible="csvUploadDialogVisible"
      header="Cargar Inventory Numbers desde CSV"
      :modal="true"
      :closable="true"
      :dismissableMask="false"
      :style="{ width: '700px' }"
      @hide="onCsvDialogClose"
    >
      <div class="space-y-6">
        <!-- Information -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="font-semibold text-blue-900 mb-2">Formato del CSV</h4>
          <p class="text-sm text-blue-800 mb-3">
            El archivo CSV debe contener las siguientes columnas (header obligatorio):
          </p>
          <div class="bg-white rounded p-3 font-mono text-xs mb-3">
            producto_sku,lot_number,inventory_number_id,quantity_available
          </div>
          <p class="text-xs text-blue-700">
            <strong>Nota:</strong> La carga REEMPLAZA completamente los inventory numbers de cada producto.
            Los productos se buscan por SKU. El location_id se toma automáticamente de la configuración de NetSuite.
          </p>
        </div>

        <!-- Download Template -->
        <div class="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
          <div>
            <p class="text-sm font-medium text-secondary-900">Descargar plantilla CSV</p>
            <p class="text-xs text-secondary-600">Archivo con ejemplo de estructura</p>
          </div>
          <Button
            label="Descargar"
            icon="pi pi-download"
            size="small"
            severity="secondary"
            outlined
            @click="downloadTemplate"
          />
        </div>

        <!-- File Input -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Seleccionar archivo CSV
          </label>
          <div class="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-secondary-400 transition-colors">
            <input
              ref="fileInputRef"
              type="file"
              accept=".csv"
              class="hidden"
              @change="onFileSelected"
            />
            <Button
              label="Seleccionar Archivo"
              icon="pi pi-file"
              severity="secondary"
              outlined
              @click="fileInputRef?.click()"
            />
            <p class="text-xs text-secondary-500 mt-2">Máximo 5MB</p>
          </div>

          <!-- Selected File Info -->
          <div v-if="csvUploadForm.selectedFile" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <i class="pi pi-file text-green-600"></i>
                <div>
                  <p class="text-sm font-medium text-green-900">{{ csvUploadForm.selectedFile.name }}</p>
                  <p class="text-xs text-green-700">{{ formatFileSize(csvUploadForm.selectedFile.size) }}</p>
                </div>
              </div>
              <Button
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                size="small"
                @click="clearSelectedFile"
              />
            </div>
          </div>

          <!-- Validation Error -->
          <small v-if="csvUploadForm.validationError" class="p-error block mt-2">
            {{ csvUploadForm.validationError }}
          </small>
        </div>

        <!-- Upload Results -->
        <div v-if="csvUploadForm.uploadResults" class="space-y-3">
          <Divider />

          <!-- Success Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-green-50 border border-green-200 rounded-lg p-3">
              <p class="text-xs text-green-700 font-medium">Productos actualizados</p>
              <p class="text-2xl font-bold text-green-900">{{ csvUploadForm.uploadResults.products_updated }}</p>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p class="text-xs text-blue-700 font-medium">Lotes creados</p>
              <p class="text-2xl font-bold text-blue-900">{{ csvUploadForm.uploadResults.inventory_numbers_created }}</p>
            </div>
          </div>

          <!-- Warning Stats -->
          <div v-if="csvUploadForm.uploadResults.products_not_found > 0 || csvUploadForm.uploadResults.errors.length > 0" class="space-y-2">
            <div v-if="csvUploadForm.uploadResults.products_not_found > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p class="text-xs text-yellow-700 font-medium">Productos no encontrados</p>
              <p class="text-xl font-bold text-yellow-900">{{ csvUploadForm.uploadResults.products_not_found }}</p>
            </div>

            <!-- Errors List -->
            <div v-if="csvUploadForm.uploadResults.errors.length > 0" class="bg-red-50 border border-red-200 rounded-lg p-3">
              <p class="text-sm font-semibold text-red-900 mb-2">Errores:</p>
              <div class="max-h-40 overflow-y-auto space-y-1">
                <div
                  v-for="(error, index) in csvUploadForm.uploadResults.errors"
                  :key="index"
                  class="text-xs text-red-800"
                >
                  <span v-if="error.sku" class="font-mono font-semibold">SKU: {{ error.sku }}</span>
                  <span v-if="error.lot_number" class="font-mono"> (Lote: {{ error.lot_number }})</span>
                  - {{ error.error }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="csvUploadDialogVisible = false"
        />
        <Button
          label="Subir Archivo"
          icon="pi pi-upload"
          :loading="csvUploadForm.uploading"
          :disabled="!csvUploadForm.selectedFile || !!csvUploadForm.validationError"
          @click="uploadCsvFile"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'
import { netsuiteApi } from '@/api/netsuite.api'
import type {
  ProductInventoryMapping,
  NetsuiteInventoryNumber,
  ProductInventoryFilters,
  CsvUploadResponse
} from '@/types/netsuite.types'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

const toast = useToast()
const authStore = useAuthStore()

// State
const loading = ref(false)
const saving = ref(false)
const products = ref<ProductInventoryMapping[]>([])
const pagination = ref({
  page: 1,
  limit: 25,
  total: 0,
  total_pages: 0
})

const filters = ref<ProductInventoryFilters>({
  search: '',
  has_mapping: null,
  page: 1,
  limit: 25
})

const mappingFilterOptions = [
  { label: 'Todos', value: null },
  { label: 'Con mapeo', value: true },
  { label: 'Sin mapear', value: false }
]

// Edit Dialog
const editDialogVisible = ref(false)
const selectedProduct = ref<ProductInventoryMapping | null>(null)
const editForm = ref({
  netsuite_item_id: '',
  inventory_numbers: [] as NetsuiteInventoryNumber[]
})
const editFormErrors = ref({
  netsuite_item_id: ''
})

// CSV Upload Dialog
const csvUploadDialogVisible = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const csvUploadForm = ref({
  selectedFile: null as File | null,
  validationError: '',
  uploading: false,
  uploadResults: null as CsvUploadResponse | null
})

let searchTimeout: any = null

const currentTiendaId = computed(() => {
  return authStore.selectedStore?.id || null
})

onMounted(() => {
  if (currentTiendaId.value) {
    loadProducts()
  }
})

async function loadProducts() {
  if (!currentTiendaId.value) return

  loading.value = true
  try {
    const response = await netsuiteApi.getProductsInventory(currentTiendaId.value, filters.value)

    if (response.success && response.data) {
      products.value = response.data.products
      pagination.value = response.data.pagination
    } else {
      throw new Error(response.message || 'Error al cargar productos')
    }
  } catch (error: any) {
    console.error('Error loading products:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar los productos',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

function onSearchChange() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    filters.value.page = 1
    loadProducts()
  }, 500)
}

function onPageChange(event: any) {
  filters.value.page = event.page + 1
  filters.value.limit = event.rows
  loadProducts()
}

function openEditDialog(product: ProductInventoryMapping) {
  selectedProduct.value = { ...product }
  editForm.value = {
    netsuite_item_id: product.netsuite_item_id || product.tiendaproducto_sku || '',
    inventory_numbers: product.inventory_numbers.map(inv => ({ ...inv }))
  }
  editFormErrors.value = {
    netsuite_item_id: ''
  }
  editDialogVisible.value = true
}

function onDialogClose() {
  selectedProduct.value = null
  editForm.value = {
    netsuite_item_id: '',
    inventory_numbers: []
  }
  editFormErrors.value = {
    netsuite_item_id: ''
  }
}

function addInventoryNumber() {
  editForm.value.inventory_numbers.push({
    item_id: parseInt(editForm.value.netsuite_item_id) || 0,
    lot_number: '',
    inventory_number_id: 0,
    location_id: 323, // Default LAVICTORIA
    quantity_available: 0
  })
}

function removeInventoryNumber(index: number) {
  editForm.value.inventory_numbers.splice(index, 1)
}

function validateForm(): boolean {
  editFormErrors.value = {
    netsuite_item_id: ''
  }

  if (!editForm.value.netsuite_item_id.trim()) {
    editFormErrors.value.netsuite_item_id = 'El NetSuite Item ID es requerido'
    return false
  }

  if (isNaN(parseInt(editForm.value.netsuite_item_id))) {
    editFormErrors.value.netsuite_item_id = 'El NetSuite Item ID debe ser un número'
    return false
  }

  return true
}

async function saveProductMapping() {
  if (!validateForm() || !selectedProduct.value || !currentTiendaId.value) {
    return
  }

  saving.value = true

  try {
    // 1. Save product NetSuite Item ID
    const productResponse = await netsuiteApi.saveProductInventory({
      tienda_id: currentTiendaId.value,
      producto_id: selectedProduct.value.tiendaproducto_id,
      netsuite_item_id: editForm.value.netsuite_item_id
    })

    if (!productResponse.success) {
      throw new Error(productResponse.message || 'Error al guardar el mapeo del producto')
    }

    // 2. Save inventory numbers
    const itemId = parseInt(editForm.value.netsuite_item_id)

    for (const invNum of editForm.value.inventory_numbers) {
      if (invNum.lot_number && invNum.inventory_number_id) {
        invNum.item_id = itemId

        if (invNum.id) {
          // Update existing
          await netsuiteApi.updateInventoryNumber(
            currentTiendaId.value,
            itemId,
            invNum.id,
            invNum
          )
        } else {
          // Create new
          await netsuiteApi.saveInventoryNumber(
            currentTiendaId.value,
            itemId,
            invNum
          )
        }
      }
    }

    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'El mapeo se guardó correctamente',
      life: 3000
    })

    editDialogVisible.value = false
    loadProducts()
  } catch (error: any) {
    console.error('Error saving product mapping:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al guardar el mapeo',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

// CSV Upload Functions

function downloadTemplate() {
  const link = document.createElement('a')
  link.href = '/templates/inventory_numbers_template.csv'
  link.download = 'inventory_numbers_template.csv'
  link.click()
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    clearSelectedFile()
    return
  }

  // Validate file
  csvUploadForm.value.validationError = ''

  // Check extension
  if (!file.name.toLowerCase().endsWith('.csv')) {
    csvUploadForm.value.validationError = 'El archivo debe ser un CSV'
    csvUploadForm.value.selectedFile = null
    return
  }

  // Check size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    csvUploadForm.value.validationError = 'El archivo es demasiado grande (máximo 5MB)'
    csvUploadForm.value.selectedFile = null
    return
  }

  csvUploadForm.value.selectedFile = file
}

function clearSelectedFile() {
  csvUploadForm.value.selectedFile = null
  csvUploadForm.value.validationError = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

async function uploadCsvFile() {
  if (!csvUploadForm.value.selectedFile || !currentTiendaId.value) {
    return
  }

  csvUploadForm.value.uploading = true
  csvUploadForm.value.uploadResults = null

  try {
    const response = await netsuiteApi.uploadInventoryCsv(
      currentTiendaId.value,
      csvUploadForm.value.selectedFile
    )

    if (response.success && response.data) {
      csvUploadForm.value.uploadResults = response.data

      // Show success message
      toast.add({
        severity: 'success',
        summary: 'Carga completada',
        detail: response.message || `${response.data.products_updated} productos actualizados, ${response.data.inventory_numbers_created} lotes creados`,
        life: 5000
      })

      // If successful (products updated > 0), reload and close after 3 seconds
      if (response.data.products_updated > 0) {
        setTimeout(() => {
          loadProducts()
          csvUploadDialogVisible.value = false
        }, 3000)
      }
    } else {
      throw new Error(response.message || 'Error al cargar el archivo CSV')
    }
  } catch (error: any) {
    console.error('Error uploading CSV:', error)

    let errorMessage = 'Error al cargar el archivo CSV'

    // Handle specific error codes
    if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'El archivo CSV está vacío o tiene formato incorrecto'
    } else if (error.response?.status === 404) {
      errorMessage = 'No se encontró configuración de NetSuite para esta tienda'
    } else if (error.response?.status === 401) {
      errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente'
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    csvUploadForm.value.uploading = false
  }
}

function onCsvDialogClose() {
  clearSelectedFile()
  csvUploadForm.value.uploadResults = null
}
</script>

<style scoped>
/* Custom styles if needed */
:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-dialog .p-dialog-content) {
  padding: 1.5rem;
}
</style>
