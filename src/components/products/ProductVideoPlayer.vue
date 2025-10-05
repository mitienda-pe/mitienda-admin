<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { ProductVideo } from '@/types/product-video.types'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

interface Props {
  video: ProductVideo | null
  productId: number
}

interface Emits {
  (e: 'delete'): void
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

const isProcessing = computed(() => {
  return props.video?.status === 'processing' || props.video?.status === 'uploading'
})

const isReady = computed(() => {
  return props.video?.status === 'ready'
})

const hasError = computed(() => {
  return props.video?.status === 'error'
})

const statusLabel = computed(() => {
  switch (props.video?.status) {
    case 'uploading':
      return 'Subiendo...'
    case 'processing':
      return 'Procesando...'
    case 'ready':
      return 'Listo'
    case 'error':
      return 'Error'
    default:
      return 'Sin video'
  }
})

const handleDelete = async () => {
  isDeleting.value = true
  try {
    const { productsApi } = await import('@/api/products.api')
    await productsApi.deleteVideo(props.productId)
    showDeleteConfirm.value = false
    emit('delete')
  } catch (error) {
    console.error('Error deleting video:', error)
  } finally {
    isDeleting.value = false
  }
}

// Load Cloudflare Stream Player script
let streamScript: HTMLScriptElement | null = null

onMounted(() => {
  // Check if script already loaded
  if (!document.querySelector('script[src*="embed.cloudflarestream.com"]')) {
    streamScript = document.createElement('script')
    streamScript.src = 'https://embed.cloudflarestream.com/embed/sdk.latest/stream.js'
    streamScript.async = true
    document.head.appendChild(streamScript)
    console.log('✅ Cloudflare Stream SDK loaded')
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Auto-refresh when processing
let refreshInterval: ReturnType<typeof setInterval> | null = null

watch(
  () => props.video?.status,
  (status) => {
    if (status === 'processing' || status === 'uploading') {
      // Poll every 5 seconds
      if (!refreshInterval) {
        refreshInterval = setInterval(() => {
          emit('refresh')
        }, 5000)
      }
    } else {
      // Stop polling
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="product-video-player">
    <!-- Processing State -->
    <div v-if="isProcessing" class="processing-state">
      <div class="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
        <div>
          <p class="font-medium text-blue-900 dark:text-blue-100">{{ statusLabel }}</p>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            El video está siendo procesado. Esto puede tomar unos minutos.
          </p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <Message severity="error" :closable="false">
        <template #default>
          <div>
            <p class="font-medium">Error al procesar el video</p>
            <p v-if="video?.error" class="text-sm mt-1">{{ video.error }}</p>
          </div>
        </template>
      </Message>
      <Button
        label="Eliminar e intentar de nuevo"
        icon="pi pi-trash"
        severity="danger"
        size="small"
        outlined
        class="mt-3"
        @click="handleDelete"
        :loading="isDeleting"
      />
    </div>

    <!-- Ready State - Video Player -->
    <div v-else-if="isReady && video?.stream_url" class="video-ready">
      <div class="relative">
        <!-- Cloudflare Stream Player - Using iframe embed -->
        <div class="video-container" style="position: relative; padding-top: 56.25%;">
          <iframe
            :src="`https://customer-1mnkfje3evk2durm.cloudflarestream.com/${video.cloudflare_uid}/iframe?poster=${encodeURIComponent(video.thumbnail_url || '')}`"
            loading="lazy"
            style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowfullscreen="true"
            class="rounded-lg"
          ></iframe>
        </div>

        <!-- Video Info -->
        <div class="flex items-center justify-between mt-3">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <i class="pi pi-clock mr-1"></i>
            Duración: {{ video.duration?.toFixed(1) }}s
          </div>
          <Button
            label="Eliminar"
            icon="pi pi-trash"
            severity="danger"
            size="small"
            outlined
            @click="showDeleteConfirm = true"
          />
        </div>

        <!-- Delete Confirmation -->
        <div
          v-if="showDeleteConfirm"
          class="mt-3 p-3 border border-red-300 rounded-lg bg-red-50 dark:bg-red-900/20"
        >
          <p class="text-sm text-red-900 dark:text-red-100 mb-2">
            ¿Estás seguro de eliminar este video? Esta acción no se puede deshacer.
          </p>
          <div class="flex gap-2">
            <Button
              label="Sí, eliminar"
              severity="danger"
              size="small"
              @click="handleDelete"
              :loading="isDeleting"
            />
            <Button
              label="Cancelar"
              severity="secondary"
              size="small"
              outlined
              @click="showDeleteConfirm = false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- No Video State -->
    <div v-else class="no-video-state">
      <div class="text-center p-6 border-2 border-dashed rounded-lg">
        <i class="pi pi-video text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-600 dark:text-gray-400">No hay video para este producto</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-video-player {
  width: 100%;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 640px;
}

stream {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
}
</style>
