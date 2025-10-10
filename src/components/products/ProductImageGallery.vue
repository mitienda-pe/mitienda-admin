<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import type { ProductImage } from '@/types/product.types'
import placeholderImage from '@/assets/images/landscape-placeholder-svgrepo-com.svg'

interface Props {
  images: ProductImage[]
  productId: number
  productName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-image': []
  'delete-image': [imageId: number]
}>()

const confirm = useConfirm()

const hoveredImageId = ref<number | null>(null)

const hasImages = computed(() => props.images && props.images.length > 0)

/**
 * Get the display URL for an image
 * Prioritizes Cloudflare URL over legacy URL
 */
const getImageUrl = (image: ProductImage): string => {
  return image.cloudflare_url || image.url || placeholderImage
}

/**
 * Check if image is from Cloudflare
 */
const isCloudflareImage = (image: ProductImage): boolean => {
  return !!image.cloudflare_url
}

/**
 * Handle add image click
 */
const handleAddImage = () => {
  emit('add-image')
}

/**
 * Handle delete image with confirmation
 */
const handleDeleteImage = (image: ProductImage) => {
  confirm.require({
    message: '¿Estás seguro de eliminar esta imagen?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      emit('delete-image', image.id)
    }
  })
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-images"></i>
          <span>Imágenes</span>
          <span v-if="hasImages" class="text-sm text-gray-600 font-normal">
            ({{ images.length }})
          </span>
        </div>
        <Button
          label="Añadir imagen"
          icon="pi pi-plus"
          size="small"
          @click="handleAddImage"
        />
      </div>
    </template>

    <template #content>
      <!-- Grid de imágenes -->
      <div v-if="hasImages" class="image-grid">
        <div
          v-for="(image, index) in images"
          :key="image.id"
          class="image-item"
          @mouseenter="hoveredImageId = image.id"
          @mouseleave="hoveredImageId = null"
        >
          <!-- Image container -->
          <div class="image-container">
            <img
              :src="getImageUrl(image)"
              :alt="`${productName} - imagen ${index + 1}`"
              class="image"
            />

            <!-- Overlay with actions -->
            <div v-if="hoveredImageId === image.id" class="image-overlay">
              <Button
                icon="pi pi-trash"
                severity="danger"
                rounded
                @click="handleDeleteImage(image)"
              />
            </div>

            <!-- Badge for main image -->
            <div v-if="image.is_main" class="badge badge-main">
              <i class="pi pi-star-fill"></i>
              <span>Principal</span>
            </div>

            <!-- Badge for Cloudflare images -->
            <div v-if="isCloudflareImage(image)" class="badge badge-cloudflare">
              <i class="pi pi-cloud"></i>
              <span>CF</span>
            </div>
          </div>

          <!-- Image position -->
          <div class="image-position">
            #{{ image.position }}
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <img :src="placeholderImage" alt="Sin imágenes" class="empty-image" />
        <p class="empty-text">No hay imágenes</p>
        <Button
          label="Añadir primera imagen"
          icon="pi pi-plus"
          @click="handleAddImage"
        />
      </div>
    </template>
  </Card>

  <ConfirmDialog />
</template>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.image-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.image-container:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.badge {
  position: absolute;
  top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.badge-main {
  left: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.badge-cloudflare {
  right: 0.5rem;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.image-position {
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-image {
  width: 200px;
  height: 200px;
  opacity: 0.3;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}
</style>
