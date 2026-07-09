<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Documentos de Facturación</h1>
      <div class="flex gap-2">
        <Button
          label="Exportar CSV"
          icon="pi pi-download"
          outlined
          :loading="documentsStore.isExporting"
          :disabled="documentsStore.pagination.total === 0"
          @click="exportCsv"
        />
        <Button
          label="Emitir Comprobante"
          icon="pi pi-plus"
          @click="$router.push('/billing/manual/emit')"
        />
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex flex-col md:flex-row md:items-end gap-3">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <InputText
            v-model="localFilters.search"
            placeholder="Orden, serie, correlativo, cliente o documento"
            class="w-full"
            @keyup.enter="applyFilters"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <Dropdown
            v-model="localFilters.document_type"
            :options="documentTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="Todos"
            class="w-full md:w-40"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            v-model="localFilters.date_from"
            type="date"
            class="p-inputtext p-component w-full md:w-auto"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            v-model="localFilters.date_to"
            type="date"
            class="p-inputtext p-component w-full md:w-auto"
          />
        </div>

        <div class="flex gap-2">
          <Button label="Filtrar" icon="pi pi-search" @click="applyFilters" />
          <Button
            label="Limpiar"
            icon="pi pi-filter-slash"
            outlined
            :disabled="!hasActiveFilters"
            @click="clearFilters"
          />
        </div>
      </div>
    </div>

    <!-- Messages -->
    <Message v-if="documentsStore.error" severity="error" @close="documentsStore.clearMessages()">
      {{ documentsStore.error }}
    </Message>

    <Message v-if="documentsStore.successMessage" severity="success" @close="documentsStore.clearMessages()">
      {{ documentsStore.successMessage }}
    </Message>

    <!-- Documents List -->
    <div class="bg-white rounded-lg shadow">
      <DataTable
        :value="documentsStore.documents"
        :loading="documentsStore.isLoading"
        striped-rows
        responsive-layout="scroll"
        :paginator="true"
        :rows="documentsStore.pagination.limit"
        :total-records="documentsStore.pagination.total"
        lazy
        @page="onPage"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rows-per-page-options="[10, 20, 50]"
        current-page-report-template="Mostrando {first} a {last} de {totalRecords} documentos"
      >
        <template #empty>
          <div class="text-center py-8 text-gray-500">
            No se encontraron documentos emitidos
          </div>
        </template>

        <Column field="order_code" header="Origen" :sortable="true">
          <template #body="{ data }">
            <template v-if="data.order_code">
              <router-link
                :to="`/orders/${data.id}`"
                class="text-primary hover:underline font-medium"
              >
                {{ data.order_code }}
              </router-link>
            </template>
            <template v-else>
              <Tag value="Manual" severity="secondary" class="text-xs" />
            </template>
          </template>
        </Column>

        <Column field="document_type" header="Tipo" :sortable="true">
          <template #body="{ data }">
            <Tag
              :value="data.document_type"
              :severity="data.document_type === 'Factura' ? 'info' : 'success'"
            />
          </template>
        </Column>

        <Column field="serie" header="Serie" :sortable="true">
          <template #body="{ data }">
            <span class="font-mono font-medium">{{ data.serie }}</span>
          </template>
        </Column>

        <Column field="correlative" header="Correlativo" :sortable="true">
          <template #body="{ data }">
            <span class="font-mono font-medium">{{ data.correlative }}</span>
          </template>
        </Column>

        <Column field="customer_name" header="Cliente" :sortable="true" />

        <Column field="customer_document" header="Documento" :sortable="true">
          <template #body="{ data }">
            <span class="font-mono text-sm">{{ data.customer_document }}</span>
          </template>
        </Column>

        <Column field="total" header="Total" :sortable="true">
          <template #body="{ data }">
            <span class="font-medium">S/ {{ parseFloat(data.total).toFixed(2) }}</span>
          </template>
        </Column>

        <Column field="emission_date" header="Fecha" :sortable="true">
          <template #body="{ data }">
            {{ formatDate(data.emission_date) }}
          </template>
        </Column>

        <Column header="Archivos">
          <template #body="{ data }">
            <div class="flex gap-2 items-center">
              <Button
                v-if="data.files?.pdf"
                icon="pi pi-file-pdf"
                severity="danger"
                text
                rounded
                size="small"
                v-tooltip.top="'Descargar PDF'"
                @click="downloadFile(data.files.pdf)"
              />
              <Button
                v-if="data.files?.xml"
                icon="pi pi-file"
                severity="info"
                text
                rounded
                size="small"
                v-tooltip.top="'Descargar XML'"
                @click="downloadFile(data.files.xml)"
              />
              <template v-if="!data.files?.pdf && !data.files?.xml">
                <template v-if="data.provider_id === 1">
                  <Button
                    icon="pi pi-file-pdf"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    :loading="legacyLoadingKey === `${data.id}-pdf`"
                    v-tooltip.top="'Recuperar PDF (sistema anterior)'"
                    @click="handleLegacyDownload(data, 'pdf')"
                  />
                  <Button
                    icon="pi pi-file"
                    severity="info"
                    text
                    rounded
                    size="small"
                    :loading="legacyLoadingKey === `${data.id}-xml`"
                    v-tooltip.top="'Recuperar XML (sistema anterior)'"
                    @click="handleLegacyDownload(data, 'xml')"
                  />
                </template>
                <span v-else class="text-gray-400 text-sm">Sin archivos</span>
              </template>
            </div>
          </template>
        </Column>

        <Column header="CDR" :sortable="false">
          <template #body="{ data }">
            <Button
              v-if="data.files?.cdr"
              icon="pi pi-check-circle"
              severity="success"
              text
              rounded
              size="small"
              v-tooltip.top="'Descargar CDR (constancia SUNAT)'"
              @click="downloadFile(data.files.cdr)"
            />
            <span v-else class="text-gray-400 text-sm">—</span>
          </template>
        </Column>

        <Column header="Acciones">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                v-if="data.customer_email"
                icon="pi pi-envelope"
                severity="info"
                text
                rounded
                :loading="sendingEmailForOrder === data.id"
                v-tooltip.top="'Enviar por Email'"
                @click="handleSendEmail(data)"
              />
              <Button
                icon="pi pi-eye"
                severity="info"
                text
                rounded
                v-tooltip.top="'Ver Detalle'"
                @click="viewDetail(data.id)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillingDocumentsStore } from '@/stores/billingDocuments.store'
import { useOrdersStore } from '@/stores/orders.store'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import type { BillingDocumentFilters } from '@/types/billing.types'

const router = useRouter()
const documentsStore = useBillingDocumentsStore()
const ordersStore = useOrdersStore()
const toast = useToast()
const sendingEmailForOrder = ref<number | null>(null)
const legacyLoadingKey = ref<string | null>(null)

const localFilters = ref<BillingDocumentFilters>({
  search: '',
  document_type: '',
  date_from: '',
  date_to: ''
})

const documentTypeOptions = [
  { label: 'Todos', value: '' },
  { label: 'Factura', value: 'factura' },
  { label: 'Boleta', value: 'boleta' }
]

const hasActiveFilters = computed(() =>
  !!(localFilters.value.search || localFilters.value.document_type ||
     localFilters.value.date_from || localFilters.value.date_to)
)

onMounted(() => {
  documentsStore.fetchDocuments()
})

const applyFilters = () => {
  documentsStore.applyFilters({
    search: localFilters.value.search?.trim() || '',
    document_type: localFilters.value.document_type || '',
    date_from: localFilters.value.date_from || '',
    date_to: localFilters.value.date_to || ''
  })
}

const clearFilters = () => {
  localFilters.value = { search: '', document_type: '', date_from: '', date_to: '' }
  documentsStore.clearFilters()
}

const exportCsv = async () => {
  await documentsStore.exportDocuments()
  if (documentsStore.error) {
    toast.add({
      severity: 'error',
      summary: 'Error al exportar',
      detail: documentsStore.error,
      life: 5000
    })
  }
}

const onPage = (event: any) => {
  const offset = event.first
  const limit = event.rows
  documentsStore.fetchDocuments(limit, offset)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'

  // Parse date string directly to avoid timezone issues
  // Backend returns dates in format "YYYY-MM-DD" (DATE type, no time)
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const year = parts[0]
    const month = parts[1]
    const day = parts[2]
    return `${day}/${month}/${year}`
  }

  // Fallback for dates with time (DATETIME format)
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadFile = (url: string) => {
  window.open(url, '_blank')
}

const handleLegacyDownload = async (doc: any, type: 'pdf' | 'xml') => {
  const key = `${doc.id}-${type}`
  try {
    legacyLoadingKey.value = key
    await documentsStore.downloadLegacyDocument(doc.id, type, `${doc.serie}-${doc.correlative}`)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'No se pudo recuperar',
      detail: 'El comprobante no pudo recuperarse del proveedor anterior. Intenta más tarde.',
      life: 5000
    })
  } finally {
    legacyLoadingKey.value = null
  }
}

const viewDetail = (id: number) => {
  router.push(`/billing/documents/${id}`)
}

const handleSendEmail = async (document: any) => {
  if (!document.customer_email) {
    toast.add({
      severity: 'warn',
      summary: 'Sin Email',
      detail: 'Este documento no tiene un email de cliente asociado',
      life: 3000
    })
    return
  }

  try {
    sendingEmailForOrder.value = document.id
    await ordersStore.resendInvoiceEmail(document.id)

    toast.add({
      severity: 'success',
      summary: 'Email Enviado',
      detail: `Factura enviada a ${document.customer_email}`,
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al Enviar',
      detail: error.response?.data?.message || 'No se pudo enviar el email',
      life: 5000
    })
  } finally {
    sendingEmailForOrder.value = null
  }
}
</script>
