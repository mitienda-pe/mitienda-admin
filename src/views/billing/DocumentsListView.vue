<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Documentos de Facturación</h1>
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

        <Column field="order_code" header="Pedido" :sortable="true">
          <template #body="{ data }">
            <router-link
              :to="`/orders/${data.id}`"
              class="text-primary hover:underline font-medium"
            >
              {{ data.order_code }}
            </router-link>
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

        <Column field="serie" header="Serie-Correlativo" :sortable="true">
          <template #body="{ data }">
            <span class="font-mono font-medium">{{ data.serie }}-{{ data.correlative }}</span>
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
            <div class="flex gap-2">
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
              <Button
                v-if="data.files?.cdr"
                icon="pi pi-check-circle"
                severity="success"
                text
                rounded
                size="small"
                v-tooltip.top="'Descargar CDR'"
                @click="downloadFile(data.files.cdr)"
              />
              <span v-if="!data.files?.pdf && !data.files?.xml && !data.files?.cdr" class="text-gray-400 text-sm">
                Sin archivos
              </span>
            </div>
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
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillingDocumentsStore } from '@/stores/billingDocuments.store'
import { useOrdersStore } from '@/stores/orders.store'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const router = useRouter()
const documentsStore = useBillingDocumentsStore()
const ordersStore = useOrdersStore()
const toast = useToast()
const sendingEmailForOrder = ref<number | null>(null)

onMounted(() => {
  documentsStore.fetchDocuments()
})

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
