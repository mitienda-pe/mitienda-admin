<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        @click="$router.push('/billing/documents')"
      />
      <h1 class="text-2xl font-bold text-gray-900">Detalle del Documento</h1>
    </div>

    <!-- Messages -->
    <Message v-if="documentsStore.error" severity="error" @close="documentsStore.clearMessages()">
      {{ documentsStore.error }}
    </Message>

    <!-- Loading -->
    <div v-if="documentsStore.isLoading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <!-- Document Detail -->
    <div v-else-if="document" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Information -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Document Info Card -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Información del Documento</span>
              <Tag
                :value="document.document_type"
                :severity="document.document_type === 'Factura' ? 'info' : 'success'"
                class="text-lg"
              />
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">Serie - Correlativo</label>
                <p class="text-lg font-mono font-bold text-gray-900">
                  {{ document.serie }}-{{ document.correlative }}
                </p>
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-600">Pedido</label>
                <p class="text-lg">
                  <router-link
                    :to="`/orders/${document.id}`"
                    class="text-primary hover:underline font-medium"
                  >
                    {{ document.order_code }}
                  </router-link>
                </p>
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-600">Fecha de Emisión</label>
                <p class="text-lg">{{ formatDate(document.emission_date) }}</p>
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-600">Total</label>
                <p class="text-lg font-bold text-gray-900">
                  S/ {{ parseFloat(document.total).toFixed(2) }}
                </p>
              </div>

              <div v-if="document.hash" class="col-span-2">
                <label class="text-sm font-semibold text-gray-600">Hash</label>
                <p class="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                  {{ document.hash }}
                </p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Customer Info Card -->
        <Card>
          <template #title>Información del Cliente</template>
          <template #content>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-gray-600">Nombre / Razón Social</label>
                <p class="text-lg">{{ document.customer_name }}</p>
              </div>

              <div>
                <label class="text-sm font-semibold text-gray-600">Documento</label>
                <p class="text-lg font-mono">{{ document.customer_document }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Files Card -->
        <Card>
          <template #title>Archivos</template>
          <template #content>
            <div class="space-y-3">
              <Button
                v-if="document.files?.pdf"
                label="Descargar PDF"
                icon="pi pi-file-pdf"
                severity="danger"
                outlined
                class="w-full"
                @click="downloadFile(document.files.pdf, `${document.serie}-${document.correlative}.pdf`)"
              />

              <Button
                v-if="document.files?.xml"
                label="Descargar XML"
                icon="pi pi-file"
                severity="info"
                outlined
                class="w-full"
                @click="downloadFile(document.files.xml, `${document.serie}-${document.correlative}.xml`)"
              />

              <Button
                v-if="document.files?.cdr"
                label="Descargar CDR"
                icon="pi pi-check-circle"
                severity="success"
                outlined
                class="w-full"
                @click="downloadFile(document.files.cdr, `${document.serie}-${document.correlative}-CDR.zip`)"
              />

              <div v-if="!document.files?.pdf && !document.files?.xml && !document.files?.cdr" class="text-center text-gray-500 py-4">
                No hay archivos disponibles
              </div>
            </div>
          </template>
        </Card>

        <!-- Provider Info -->
        <Card>
          <template #title>Proveedor</template>
          <template #content>
            <div class="text-center">
              <p class="text-lg font-semibold text-gray-900">
                {{ getProviderName(document.provider_id) }}
              </p>
              <p class="text-sm text-gray-500">ID: {{ document.provider_id }}</p>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500">No se encontró el documento</p>
      <Button
        label="Volver al listado"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="$router.push('/billing/documents')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBillingDocumentsStore } from '@/stores/billingDocuments.store'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const documentsStore = useBillingDocumentsStore()

const document = computed(() => documentsStore.currentDocument)

onMounted(() => {
  const id = parseInt(route.params.id as string)
  if (id) {
    documentsStore.fetchDocumentDetail(id)
  }
})

onUnmounted(() => {
  documentsStore.clearCurrentDocument()
})

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const downloadFile = (url: string, filename: string) => {
  window.open(url, '_blank')
}

const getProviderName = (providerId: number) => {
  const providers: Record<number, string> = {
    1: 'Factura en Una',
    2: 'NubeFact',
    3: 'Bizlinks'
  }
  return providers[providerId] || 'Desconocido'
}
</script>
