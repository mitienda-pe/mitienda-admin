<template>
  <div class="document-uploader">
    <div class="uploader-header">
      <h4>Agregar Documento</h4>
      <span class="text-sm text-gray-600">Max 3 documentos PDF · Máx 5MB por archivo</span>
    </div>

    <div v-if="!isUploading" class="upload-form">
      <!-- Nombre del documento -->
      <div class="form-field">
        <label for="document-name">Nombre del documento</label>
        <InputText
          id="document-name"
          v-model="documentName"
          placeholder="Ej: Ficha Técnica, Manual de Usuario, Certificado..."
          :disabled="isUploading"
        />
      </div>

      <!-- File input -->
      <div class="form-field">
        <label>Archivo PDF</label>
        <FileUpload
          mode="basic"
          accept="application/pdf,.pdf"
          :maxFileSize="5242880"
          :auto="false"
          chooseLabel="Seleccionar PDF"
          :disabled="isUploading"
          @select="onFileSelect"
          @clear="onFileClear"
        >
          <template #empty>
            <p>Arrastra un archivo PDF aquí o haz clic para seleccionar</p>
          </template>
        </FileUpload>

        <div v-if="selectedFile" class="selected-file">
          <i class="pi pi-file-pdf"></i>
          <span>{{ selectedFile.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
        </div>

        <div v-if="validationError" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ validationError }}</span>
        </div>
      </div>

      <!-- Upload button -->
      <Button
        label="Subir Documento"
        icon="pi pi-upload"
        :disabled="!selectedFile || !documentName || isUploading"
        @click="handleUpload"
      />
    </div>

    <!-- Progress state -->
    <div v-else class="upload-progress">
      <div class="progress-header">
        <i class="pi pi-spin pi-spinner"></i>
        <span class="font-medium">Subiendo documento...</span>
      </div>

      <ProgressBar :value="uploadProgress" :showValue="true" />

      <p class="text-xs text-gray-600 mt-2">
        {{ selectedFile?.name }} · {{ formatFileSize(selectedFile?.size || 0) }}
      </p>

      <p class="text-xs text-gray-600 mt-2">
        El documento se está subiendo. Puede continuar trabajando, el proceso continuará en segundo plano.
      </p>
    </div>

    <!-- Success message -->
    <Message v-if="uploadSuccess" severity="success" :closable="true" @close="uploadSuccess = false">
      Documento subido exitosamente
    </Message>

    <!-- Error message -->
    <Message v-if="uploadError" severity="error" :closable="true" @close="uploadError = null">
      {{ uploadError }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import { productsApi } from '@/api/products.api'

interface Props {
  productId: number
  maxDocuments?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDocuments: 3
})

const emit = defineEmits<{
  uploadSuccess: [documentId: number]
  uploadError: [error: string]
}>()

// State
const documentName = ref('')
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadSuccess = ref(false)
const uploadError = ref<string | null>(null)
const validationError = ref<string | null>(null)

// File selection handlers
const onFileSelect = (event: any) => {
  validationError.value = null
  uploadError.value = null

  const file = event.files[0]

  // Validate file type
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    validationError.value = 'Solo se permiten archivos PDF'
    selectedFile.value = null
    return
  }

  // Validate file size (5MB = 5,242,880 bytes)
  if (file.size > 5242880) {
    validationError.value = 'El archivo excede el tamaño máximo de 5MB'
    selectedFile.value = null
    return
  }

  selectedFile.value = file
}

const onFileClear = () => {
  selectedFile.value = null
  validationError.value = null
}

// Upload handler
const handleUpload = async () => {
  if (!selectedFile.value || !documentName.value) {
    return
  }

  isUploading.value = true
  uploadProgress.value = 0
  uploadError.value = null
  uploadSuccess.value = false

  try {
    // Simulate progress animation
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    // Upload document
    const response = await productsApi.uploadDocument(
      props.productId,
      selectedFile.value,
      documentName.value
    )

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success && response.data) {
      uploadSuccess.value = true

      // Reset form after 2 seconds
      setTimeout(() => {
        documentName.value = ''
        selectedFile.value = null
        uploadProgress.value = 0
        isUploading.value = false
        uploadSuccess.value = false
      }, 2000)

      emit('uploadSuccess', response.data.documento_id)
    } else {
      throw new Error(response.message || 'Error al subir documento')
    }
  } catch (error: any) {
    console.error('Upload error:', error)

    let errorMessage = 'Error al subir el documento'

    if (error.response?.status === 400) {
      const apiError = error.response.data?.message || error.response.data?.error
      if (apiError) {
        if (apiError.includes('Maximum 3 documents')) {
          errorMessage = 'Máximo 3 documentos permitidos por producto'
        } else if (apiError.includes('Only PDF')) {
          errorMessage = 'Solo se permiten archivos PDF'
        } else if (apiError.includes('exceeds 5MB')) {
          errorMessage = 'El archivo excede el tamaño máximo de 5MB'
        } else {
          errorMessage = apiError
        }
      }
    } else if (error.response?.status === 404) {
      errorMessage = 'Producto no encontrado'
    }

    uploadError.value = errorMessage
    isUploading.value = false
    uploadProgress.value = 0

    emit('uploadError', errorMessage)
  }
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(2) + ' MB'
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  }
  return bytes + ' B'
}
</script>

<style scoped>
.document-uploader {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.uploader-header {
  margin-bottom: 1.5rem;
}

.uploader-header h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.uploader-header .text-sm {
  font-size: 0.875rem;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 6px;
  margin-top: 0.5rem;
}

.selected-file i {
  color: #ef4444;
  font-size: 1.25rem;
}

.selected-file .file-size {
  margin-left: auto;
  color: #6b7280;
  font-size: 0.875rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2563eb;
}

.text-gray-600 {
  color: #6b7280;
}

.mt-2 {
  margin-top: 0.5rem;
}

.text-xs {
  font-size: 0.75rem;
}

.font-medium {
  font-weight: 500;
}
</style>
