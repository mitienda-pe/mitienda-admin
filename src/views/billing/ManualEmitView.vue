<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBillingManualStore } from '@/stores/billingManual.store'
import { useFormatters } from '@/composables/useFormatters'
import CustomerSearchSection from '@/components/billing/CustomerSearchSection.vue'
import LineItemsTable from '@/components/billing/LineItemsTable.vue'
import AddProductDialog from '@/components/billing/AddProductDialog.vue'
import AddManualItemDialog from '@/components/billing/AddManualItemDialog.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import type { ManualDocumentType, ManualDocumentItem } from '@/types/billing.types'
import { CREDIT_NOTE_TYPES } from '@/types/billing.types'

const router = useRouter()
const store = useBillingManualStore()
const { formatCurrency } = useFormatters()

// Dialog visibility
const showAddProductDialog = ref(false)
const showAddManualItemDialog = ref(false)
const showSuccessDialog = ref(false)

// Document type options
const documentTypeOptions = [
  { label: 'Factura', value: 1 as ManualDocumentType },
  { label: 'Boleta', value: 2 as ManualDocumentType },
  { label: 'Nota de Crédito', value: 3 as ManualDocumentType }
]

// PDF format options
const pdfFormatOptions = [
  { label: 'A4 (Estándar)', value: 'A4' as const },
  { label: 'Ticket / 80mm', value: '80MM' as const }
]

// Handle document type change
function onDocumentTypeChange(type: ManualDocumentType) {
  store.setDocumentType(type)
}

// Handle add product from catalog
function handleAddProduct(product: any) {
  const item: Omit<ManualDocumentItem, 'id'> = {
    product_id: product.id,
    code: product.sku || '',
    description: product.name || product.title,
    unit: 'NIU',
    quantity: 1,
    unit_price: product.price || 0,
    affectation_type: 10 // Gravado
  }
  store.addItem(item)
  showAddProductDialog.value = false
}

// Handle add manual item
function handleAddManualItem(item: Omit<ManualDocumentItem, 'id'>) {
  store.addItem(item)
  showAddManualItemDialog.value = false
}

// Handle emit
async function handleEmit() {
  const result = await store.emit()
  if (result.success) {
    showSuccessDialog.value = true
  }
}

// Handle success dialog close
function handleSuccessClose() {
  showSuccessDialog.value = false
  store.reset()
  router.push('/billing/documents')
}

// Handle cancel
function handleCancel() {
  store.reset()
  router.push('/billing/documents')
}

// Download PDF
function downloadPdf() {
  if (store.lastEmitResponse?.files?.pdf) {
    window.open(store.lastEmitResponse.files.pdf, '_blank')
  }
}

// Reset on mount
onMounted(() => {
  store.reset()
})

// Cleanup on unmount
onUnmounted(() => {
  store.clearMessages()
})
</script>

<template>
  <div class="p-4 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Emitir Comprobante Manual</h1>
        <p class="text-gray-500 mt-1">Crea facturas, boletas o notas de crédito sin una orden preexistente</p>
      </div>
      <Button
        label="Cancelar"
        severity="secondary"
        text
        @click="handleCancel"
      />
    </div>

    <!-- Error Message -->
    <Message v-if="store.error" severity="error" :closable="true" @close="store.clearMessages" class="mb-4">
      {{ store.error }}
    </Message>

    <!-- Document Type Selection -->
    <Card class="mb-4">
      <template #title>Tipo de Comprobante</template>
      <template #content>
        <div class="flex gap-3">
          <Button
            v-for="option in documentTypeOptions"
            :key="option.value"
            :label="option.label"
            :severity="store.documentType === option.value ? 'primary' : 'secondary'"
            :outlined="store.documentType !== option.value"
            @click="onDocumentTypeChange(option.value)"
            class="flex-1"
          />
        </div>

        <!-- Credit Note Type (only for NC) -->
        <div v-if="store.documentType === 3" class="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Nota de Crédito</label>
            <Dropdown
              v-model="store.creditNoteType"
              :options="[...CREDIT_NOTE_TYPES]"
              optionLabel="label"
              optionValue="code"
              placeholder="Seleccionar tipo"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <InputText
              v-model="store.creditNoteReason"
              placeholder="Ej: Anulación por error en facturación"
              class="w-full"
            />
          </div>
        </div>

        <!-- Reference Document (only for NC) -->
        <div v-if="store.documentType === 3" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Documento de Referencia</label>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Tipo</label>
              <Dropdown
                :modelValue="store.referenceDocument?.type || 1"
                :options="[{ label: 'Factura', value: 1 }, { label: 'Boleta', value: 2 }]"
                optionLabel="label"
                optionValue="value"
                @update:modelValue="(v: number) => store.setReferenceDocument({ ...(store.referenceDocument || { serie: '', correlativo: 0 }), type: v as ManualDocumentType })"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Serie</label>
              <InputText
                :modelValue="store.referenceDocument?.serie || ''"
                @update:modelValue="(v: string | undefined) => store.setReferenceDocument({ ...(store.referenceDocument || { type: 1, correlativo: 0 }), serie: v || '' })"
                placeholder="F001"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Correlativo</label>
              <InputText
                :modelValue="store.referenceDocument?.correlativo?.toString() || ''"
                @update:modelValue="(v: string | undefined) => store.setReferenceDocument({ ...(store.referenceDocument || { type: 1, serie: '' }), correlativo: parseInt(v || '0') || 0 })"
                placeholder="123"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Customer Section -->
    <Card class="mb-4">
      <template #title>Cliente</template>
      <template #content>
        <CustomerSearchSection
          :document-type="store.documentType"
          :client="store.client"
          :is-looking-up="store.isLookingUp"
          @update:client="store.setClient"
          @lookup="store.lookupDocument"
        />
      </template>
    </Card>

    <!-- Items Section -->
    <Card class="mb-4">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Productos / Servicios</span>
          <div class="flex gap-2">
            <Button
              label="Agregar del catálogo"
              icon="pi pi-search"
              severity="secondary"
              size="small"
              @click="showAddProductDialog = true"
            />
            <Button
              label="Agregar item manual"
              icon="pi pi-plus"
              severity="secondary"
              size="small"
              outlined
              @click="showAddManualItemDialog = true"
            />
          </div>
        </div>
      </template>
      <template #content>
        <LineItemsTable
          :items="store.items"
          @update:item="store.updateItem"
          @remove:item="store.removeItem"
        />

        <Message v-if="store.items.length === 0" severity="info" :closable="false" class="mt-4">
          Agregue al menos un producto o servicio para continuar
        </Message>
      </template>
    </Card>

    <!-- Summary Section -->
    <Card class="mb-4">
      <template #content>
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Formato PDF</label>
              <Dropdown
                v-model="store.pdfFormat"
                :options="pdfFormatOptions"
                optionLabel="label"
                optionValue="value"
                class="w-48"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Observaciones (opcional)</label>
              <InputText
                v-model="store.notes"
                placeholder="Notas adicionales para el comprobante"
                class="w-full max-w-md"
              />
            </div>
          </div>

          <div class="text-right min-w-[200px]">
            <div class="flex justify-between py-1">
              <span class="text-gray-600">Subtotal:</span>
              <span class="font-mono">{{ formatCurrency(store.totals.subtotal) }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-gray-600">IGV (18%):</span>
              <span class="font-mono">{{ formatCurrency(store.totals.igv) }}</span>
            </div>
            <div class="flex justify-between py-2 border-t border-gray-200 mt-2">
              <span class="font-semibold text-lg">TOTAL:</span>
              <span class="font-mono font-bold text-lg text-primary">{{ formatCurrency(store.totals.total) }}</span>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-3">
      <Button
        label="Cancelar"
        severity="secondary"
        outlined
        @click="handleCancel"
      />
      <Button
        label="Emitir Comprobante"
        icon="pi pi-check"
        :loading="store.isEmitting"
        :disabled="!store.isValid"
        @click="handleEmit"
      />
    </div>

    <!-- Add Product Dialog -->
    <AddProductDialog
      :visible="showAddProductDialog"
      @update:visible="showAddProductDialog = $event"
      @select="handleAddProduct"
    />

    <!-- Add Manual Item Dialog -->
    <AddManualItemDialog
      :visible="showAddManualItemDialog"
      @update:visible="showAddManualItemDialog = $event"
      @add="handleAddManualItem"
    />

    <!-- Success Dialog -->
    <Dialog
      v-model:visible="showSuccessDialog"
      header="Comprobante Emitido"
      :modal="true"
      :closable="false"
      :style="{ width: '400px' }"
    >
      <div class="text-center py-4">
        <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
        <p class="text-lg font-medium mb-2">Comprobante emitido exitosamente</p>
        <p v-if="store.lastEmitResponse" class="text-gray-600">
          Serie: {{ store.lastEmitResponse.serie }} - Correlativo: {{ store.lastEmitResponse.correlative }}
        </p>
        <p v-if="store.lastEmitResponse" class="text-lg font-semibold mt-2">
          Total: {{ formatCurrency(store.lastEmitResponse.total) }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-center gap-3">
          <Button
            v-if="store.lastEmitResponse?.files?.pdf"
            label="Descargar PDF"
            icon="pi pi-file-pdf"
            severity="danger"
            @click="downloadPdf"
          />
          <Button
            label="Cerrar"
            severity="secondary"
            @click="handleSuccessClose"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
