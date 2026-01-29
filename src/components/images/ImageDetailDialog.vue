<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="image?.title || 'Detalle de Imagen'"
    :modal="true"
    :style="{ width: '720px' }"
    :dismissableMask="true"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else-if="image" class="space-y-6">
      <!-- Preview -->
      <div class="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden" style="max-height: 360px">
        <img
          :src="image.preview_url || image.thumbnail_url || ''"
          :alt="image.alt_text || image.title || ''"
          class="max-w-full max-h-[360px] object-contain"
        />
      </div>

      <!-- Source Badge + Info -->
      <div class="flex items-center gap-3 flex-wrap">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          :class="image.source === 'cloudflare' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
        >
          <i :class="image.source === 'cloudflare' ? 'pi pi-cloud' : 'pi pi-server'" class="mr-1"></i>
          {{ image.source === 'cloudflare' ? 'Cloudflare' : 'Legacy S3' }}
        </span>
        <span v-if="image.width && image.height" class="text-sm text-secondary-500">
          {{ image.width }} × {{ image.height }} px
        </span>
        <span v-if="image.file_size" class="text-sm text-secondary-500">
          {{ formatFileSize(image.file_size) }}
        </span>
        <span v-if="image.uploaded_at" class="text-sm text-secondary-500">
          {{ formatDate(image.uploaded_at) }}
        </span>
      </div>

      <!-- Metadata Form -->
      <div class="space-y-3">
        <h4 class="text-sm font-semibold text-secondary-700">Metadata</h4>
        <div>
          <label class="block text-sm text-secondary-600 mb-1">Título</label>
          <InputText v-model="form.title" class="w-full" placeholder="Título de la imagen" />
        </div>
        <div>
          <label class="block text-sm text-secondary-600 mb-1">Texto alternativo</label>
          <InputText
            v-model="form.alt_text"
            class="w-full"
            placeholder="Texto alternativo (SEO)"
            :disabled="image.source === 'cloudflare'"
          />
          <small v-if="image.source === 'cloudflare'" class="text-secondary-400">
            No disponible para imágenes de Cloudflare
          </small>
        </div>
        <div>
          <label class="block text-sm text-secondary-600 mb-1">Descripción</label>
          <Textarea
            v-model="form.description"
            class="w-full"
            rows="2"
            placeholder="Descripción de la imagen"
            :disabled="image.source === 'cloudflare'"
          />
          <small v-if="image.source === 'cloudflare'" class="text-secondary-400">
            No disponible para imágenes de Cloudflare
          </small>
        </div>
        <Button
          label="Guardar Metadata"
          icon="pi pi-save"
          size="small"
          :loading="isSaving"
          @click="handleSaveMetadata"
        />
      </div>

      <!-- Variants -->
      <div v-if="image.variants && image.variants.length > 0">
        <h4 class="text-sm font-semibold text-secondary-700 mb-2">Variantes / Tamaños</h4>
        <div class="border rounded-lg divide-y">
          <div
            v-for="variant in image.variants"
            :key="variant.name"
            class="flex items-center justify-between px-3 py-2 hover:bg-gray-50"
          >
            <div class="flex-1 min-w-0">
              <span class="text-sm font-medium text-secondary-700">{{ variant.name }}</span>
              <span v-if="variant.width && variant.height" class="text-xs text-secondary-400 ml-2">
                {{ variant.width }} × {{ variant.height }}
              </span>
            </div>
            <div class="flex items-center gap-2 ml-2">
              <InputText
                :modelValue="variant.url"
                readonly
                class="text-xs w-48 lg:w-64"
                size="small"
              />
              <Button
                icon="pi pi-copy"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.top="'Copiar URL'"
                @click="copyUrl(variant.url, variant.name)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Used by Products -->
      <div v-if="image.used_by_products && image.used_by_products.length > 0">
        <h4 class="text-sm font-semibold text-secondary-700 mb-2">Usado en productos</h4>
        <div class="flex flex-wrap gap-2">
          <router-link
            v-for="product in image.used_by_products"
            :key="product.id"
            :to="`/products/${product.id}`"
            class="text-sm text-primary hover:underline"
            @click="$emit('update:visible', false)"
          >
            {{ product.name }}
          </router-link>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useImageGalleryStore } from '@/stores/image-gallery.store'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import type { GalleryImageDetail, ImageSource } from '@/types/gallery-image.types'

const props = defineProps<{
  visible: boolean
  imageId: number | null
  imageSource: ImageSource | null
}>()

defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'metadata-updated'): void
}>()

const toast = useToast()
const galleryStore = useImageGalleryStore()

const image = ref<GalleryImageDetail | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)

const form = reactive({
  title: '',
  alt_text: '',
  description: '',
})

watch(
  () => [props.visible, props.imageId, props.imageSource],
  async ([visible, id, source]) => {
    if (visible && id && source) {
      try {
        isLoading.value = true
        await galleryStore.fetchImageDetail(id as number, source as ImageSource)
        image.value = galleryStore.selectedImage
        if (image.value) {
          form.title = image.value.title || ''
          form.alt_text = image.value.alt_text || ''
          form.description = image.value.description || ''
        }
      } finally {
        isLoading.value = false
      }
    } else if (!visible) {
      image.value = null
      galleryStore.clearSelectedImage()
    }
  }
)

const handleSaveMetadata = async () => {
  if (!image.value) return
  try {
    isSaving.value = true
    await galleryStore.updateMetadata(image.value.id, image.value.source, {
      title: form.title,
      alt_text: form.alt_text,
      description: form.description,
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Metadata actualizada', life: 3000 })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al guardar metadata',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

const copyUrl = async (url: string, name: string) => {
  try {
    await navigator.clipboard.writeText(url)
    toast.add({ severity: 'success', summary: 'Copiado', detail: `URL de ${name} copiada`, life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo copiar', life: 3000 })
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}
</script>
