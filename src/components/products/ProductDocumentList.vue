<template>
  <div class="document-list">
    <div v-if="documents.length === 0" class="empty-state">
      <i class="pi pi-file-pdf"></i>
      <p>No hay documentos agregados</p>
      <span class="text-sm text-gray-600">Agrega fichas técnicas, manuales o certificados en PDF</span>
    </div>

    <div v-else class="documents-grid">
      <div
        v-for="document in sortedDocuments"
        :key="document.id"
        class="document-card"
      >
        <!-- Document icon and info -->
        <div class="document-icon">
          <i class="pi pi-file-pdf"></i>
        </div>

        <div class="document-info">
          <h5 class="document-name">{{ document.name }}</h5>
          <p class="document-filename">{{ document.filename }}</p>
          <div class="document-meta">
            <span class="document-size">{{ document.size_formatted }}</span>
            <span class="document-date">{{ formatDate(document.created_at) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="document-actions">
          <Button
            icon="pi pi-download"
            text
            rounded
            severity="secondary"
            v-tooltip.top="'Descargar'"
            :disabled="!document.url"
            @click="handleDownload(document)"
          />

          <Button
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            v-tooltip.top="'Eliminar'"
            :disabled="isDeleting"
            @click="confirmDelete(document)"
          />
        </div>

        <!-- Order badge -->
        <div class="document-order">{{ document.order }}</div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      :header="`Eliminar documento`"
      :modal="true"
      :closable="!isDeleting"
      :style="{ width: '450px' }"
    >
      <div class="dialog-content">
        <i class="pi pi-exclamation-triangle dialog-icon"></i>
        <div>
          <p class="dialog-message">¿Estás seguro de eliminar este documento?</p>
          <p class="dialog-document-name">{{ documentToDelete?.name }}</p>
          <p class="dialog-warning">Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          text
          :disabled="isDeleting"
          @click="showDeleteDialog = false"
        />
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          :loading="isDeleting"
          @click="handleDelete"
        />
      </template>
    </Dialog>

    <!-- Error message -->
    <Message v-if="deleteError" severity="error" :closable="true" @close="deleteError = null">
      {{ deleteError }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { productsApi } from '@/api/products.api'
import type { ProductDocument } from '@/types/product-document.types'

interface Props {
  productId: number
  documents: ProductDocument[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deleteSuccess: [documentId: number]
  deleteError: [error: string]
}>()

// State
const showDeleteDialog = ref(false)
const documentToDelete = ref<ProductDocument | null>(null)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)

// Computed
const sortedDocuments = computed(() => {
  return [...props.documents].sort((a, b) => a.order - b.order)
})

// Delete confirmation
const confirmDelete = (document: ProductDocument) => {
  documentToDelete.value = document
  showDeleteDialog.value = true
  deleteError.value = null
}

// Delete handler
const handleDelete = async () => {
  if (!documentToDelete.value) return

  isDeleting.value = true
  deleteError.value = null

  try {
    const response = await productsApi.deleteDocument(
      props.productId,
      documentToDelete.value.id
    )

    if (response.success) {
      showDeleteDialog.value = false
      emit('deleteSuccess', documentToDelete.value.id)
      documentToDelete.value = null
    } else {
      throw new Error(response.message || 'Error al eliminar documento')
    }
  } catch (error: any) {
    console.error('Delete error:', error)

    let errorMessage = 'Error al eliminar el documento'

    if (error.response?.status === 404) {
      errorMessage = 'Documento no encontrado'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    deleteError.value = errorMessage
    emit('deleteError', errorMessage)
  } finally {
    isDeleting.value = false
  }
}

// Download handler
const handleDownload = (document: ProductDocument) => {
  if (!document.url) {
    console.error('Document URL not available')
    return
  }

  // Open in new tab
  window.open(document.url, '_blank', 'noopener,noreferrer')
}

// Format date
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Sin fecha'

  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  } catch {
    return 'Sin fecha'
  }
}
</script>

<style scoped>
.document-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.empty-state p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}

.empty-state .text-sm {
  font-size: 0.875rem;
  color: #6b7280;
}

.documents-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.document-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.document-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: #fef2f2;
  border-radius: 8px;
  flex-shrink: 0;
}

.document-icon i {
  font-size: 1.5rem;
  color: #ef4444;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-filename {
  margin: 0 0 0.5rem 0;
  font-size: 0.8125rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.document-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.document-order {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
}

/* Dialog styles */
.dialog-content {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
}

.dialog-icon {
  font-size: 2rem;
  color: #f59e0b;
  flex-shrink: 0;
}

.dialog-message {
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
  color: #111827;
}

.dialog-document-name {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  color: #374151;
}

.dialog-warning {
  margin: 0;
  font-size: 0.8125rem;
  color: #6b7280;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-600 {
  color: #6b7280;
}
</style>
