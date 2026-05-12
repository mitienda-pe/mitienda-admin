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
  'reorder': [images: Array<{ id: number; source: 'r2' | 'cloudflare' | 'legacy' }>]
}>()

const confirm = useConfirm()

const hasImages = computed(() => props.images && props.images.length > 0)

const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const getImageUrl = (image: ProductImage): string => {
  return image.cloudflare_url || image.url || placeholderImage
}

const isCloudflareImage = (image: ProductImage): boolean => {
  return !!image.cloudflare_url
}

const handleAddImage = () => {
  emit('add-image')
}

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

const onDragStart = (index: number, event: DragEvent) => {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    // Firefox requires data to start the drag
    event.dataTransfer.setData('text/plain', String(index))
  }
}

const onDragOver = (index: number, event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  if (dragOverIndex.value !== index) dragOverIndex.value = index
}

const onDragLeave = (index: number) => {
  if (dragOverIndex.value === index) dragOverIndex.value = null
}

const onDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault()
  const sourceIndex = dragIndex.value
  dragIndex.value = null
  dragOverIndex.value = null

  if (sourceIndex === null || sourceIndex === targetIndex) return

  const reordered = [...props.images]
  const [moved] = reordered.splice(sourceIndex, 1)
  reordered.splice(targetIndex, 0, moved)

  emit('reorder', reordered.map(img => ({
    id: img.id,
    source: (img.source ?? 'legacy') as 'r2' | 'cloudflare' | 'legacy'
  })))
}

const onDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
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
      <p v-if="hasImages && images.length > 1" class="reorder-hint">
        <i class="pi pi-arrows-alt"></i>
        Arrastra las imágenes para reordenarlas. La primera será la principal.
      </p>

      <div v-if="hasImages" class="image-grid">
        <div
          v-for="(image, index) in images"
          :key="`${image.source ?? 'legacy'}-${image.id}`"
          class="image-item"
          :class="{
            'is-dragging': dragIndex === index,
            'is-drag-over': dragOverIndex === index && dragIndex !== index
          }"
          draggable="true"
          @dragstart="onDragStart(index, $event)"
          @dragover="onDragOver(index, $event)"
          @dragleave="onDragLeave(index)"
          @drop="onDrop(index, $event)"
          @dragend="onDragEnd"
        >
          <div class="image-container">
            <img
              :src="getImageUrl(image)"
              :alt="`${productName} - imagen ${index + 1}`"
              class="image"
              draggable="false"
            />

            <button
              type="button"
              class="delete-btn"
              :aria-label="`Eliminar imagen ${index + 1}`"
              @click.stop="handleDeleteImage(image)"
            >
              <i class="pi pi-trash"></i>
            </button>

            <div class="drag-handle" aria-hidden="true">
              <i class="pi pi-arrows-alt"></i>
            </div>

            <div v-if="index === 0" class="badge badge-main">
              <i class="pi pi-star-fill"></i>
              <span>Principal</span>
            </div>

            <div v-if="isCloudflareImage(image)" class="badge badge-cloudflare">
              <i class="pi pi-cloud"></i>
              <span>CF</span>
            </div>
          </div>

          <div class="image-position">
            #{{ index + 1 }}
          </div>
        </div>
      </div>

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
.reorder-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.image-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: grab;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.image-item:active {
  cursor: grabbing;
}

.image-item.is-dragging {
  opacity: 0.4;
}

.image-item.is-drag-over .image-container {
  border-color: var(--primary-color, #00b2a6);
  border-style: dashed;
  transform: scale(1.02);
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
  border-color: var(--primary-color, #00b2a6);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.delete-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(220, 38, 38, 0.92);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, background 0.15s ease;
  z-index: 2;
}

.delete-btn:hover {
  background: rgb(185, 28, 28);
  transform: scale(1.08);
}

.delete-btn:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

.delete-btn .pi {
  font-size: 0.95rem;
}

.drag-handle {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.image-container:hover .drag-handle {
  opacity: 1;
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
  pointer-events: none;
}

.badge-main {
  left: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.badge-cloudflare {
  /* shifted left to leave room for the always-visible delete button */
  right: 3rem;
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
