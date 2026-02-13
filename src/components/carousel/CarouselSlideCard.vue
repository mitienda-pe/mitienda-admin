<script setup lang="ts">
import Button from 'primevue/button'
import type { CarouselSlide } from '@/types/carousel.types'

interface Props {
  slide: CarouselSlide
  index: number
  totalSlides: number
}

defineProps<Props>()

const emit = defineEmits<{
  edit: [slide: CarouselSlide]
  'upload-desktop': [slide: CarouselSlide]
  'upload-mobile': [slide: CarouselSlide]
  'delete-mobile': [slide: CarouselSlide]
  delete: [slide: CarouselSlide]
  'move-up': [slide: CarouselSlide]
  'move-down': [slide: CarouselSlide]
}>()
</script>

<template>
  <div class="slide-card">
    <div class="slide-card__header">
      <div class="flex items-center gap-2">
        <span class="slide-card__number">{{ index + 1 }}</span>
        <span v-if="slide.tiendacarruselimagen_titulo" class="text-sm text-gray-700 font-medium truncate max-w-xs">
          {{ slide.tiendacarruselimagen_titulo }}
        </span>
        <span v-else class="text-sm text-gray-400 italic">Sin texto alternativo</span>
      </div>
      <div class="flex items-center gap-1">
        <Button
          icon="pi pi-chevron-up"
          severity="secondary"
          text
          rounded
          size="small"
          :disabled="index === 0"
          @click="emit('move-up', slide)"
          v-tooltip.top="'Mover arriba'"
        />
        <Button
          icon="pi pi-chevron-down"
          severity="secondary"
          text
          rounded
          size="small"
          :disabled="index === totalSlides - 1"
          @click="emit('move-down', slide)"
          v-tooltip.top="'Mover abajo'"
        />
        <Button
          icon="pi pi-pencil"
          severity="secondary"
          text
          rounded
          size="small"
          @click="emit('edit', slide)"
          v-tooltip.top="'Editar'"
        />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          size="small"
          @click="emit('delete', slide)"
          v-tooltip.top="'Eliminar'"
        />
      </div>
    </div>

    <div class="slide-card__content">
      <!-- Desktop image -->
      <div class="slide-card__image-section">
        <div class="slide-card__image-label">
          <i class="pi pi-desktop text-xs"></i>
          <span>Desktop</span>
          <span v-if="slide.tiendacarruselimagen_desktop_aspect" class="text-gray-400">
            ({{ slide.tiendacarruselimagen_desktop_aspect }})
          </span>
        </div>
        <div
          class="slide-card__image-preview slide-card__image-preview--desktop"
          @click="emit('upload-desktop', slide)"
        >
          <img
            v-if="slide.tiendacarruselimagen_desktop_r2_url"
            :src="slide.tiendacarruselimagen_desktop_r2_url"
            :alt="slide.tiendacarruselimagen_titulo || 'Desktop'"
          />
          <div v-else class="slide-card__placeholder">
            <i class="pi pi-image text-2xl text-gray-400"></i>
            <span class="text-xs text-gray-400">Imagen legacy</span>
          </div>
          <div class="slide-card__image-overlay">
            <i class="pi pi-camera"></i>
          </div>
        </div>
      </div>

      <!-- Mobile image -->
      <div class="slide-card__image-section">
        <div class="slide-card__image-label">
          <i class="pi pi-mobile text-xs"></i>
          <span>Mobile</span>
          <span v-if="slide.tiendacarruselimagen_mobile_aspect" class="text-gray-400">
            ({{ slide.tiendacarruselimagen_mobile_aspect }})
          </span>
        </div>
        <div
          class="slide-card__image-preview slide-card__image-preview--mobile"
          @click="emit('upload-mobile', slide)"
        >
          <img
            v-if="slide.tiendacarruselimagen_mobile_r2_url"
            :src="slide.tiendacarruselimagen_mobile_r2_url"
            :alt="slide.tiendacarruselimagen_titulo || 'Mobile'"
          />
          <div v-else class="slide-card__placeholder">
            <i class="pi pi-plus text-xl text-gray-400"></i>
            <span class="text-xs text-gray-400">Agregar mobile</span>
          </div>
          <div class="slide-card__image-overlay">
            <i class="pi pi-camera"></i>
          </div>
        </div>
        <Button
          v-if="slide.tiendacarruselimagen_mobile_r2_url"
          label="Quitar"
          icon="pi pi-times"
          severity="secondary"
          text
          size="small"
          class="mt-1"
          @click="emit('delete-mobile', slide)"
        />
      </div>
    </div>

    <!-- Link -->
    <div v-if="slide.tiendacarruselimagen_enlace" class="slide-card__link">
      <i class="pi pi-link text-xs text-gray-400"></i>
      <a
        :href="slide.tiendacarruselimagen_enlace"
        target="_blank"
        class="text-xs text-primary hover:underline truncate"
      >
        {{ slide.tiendacarruselimagen_enlace }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.slide-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.slide-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbfc;
}

.slide-card__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #00b2a6;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.slide-card__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
}

.slide-card__image-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slide-card__image-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.slide-card__image-preview {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s;
}

.slide-card__image-preview:hover {
  border-color: #00b2a6;
}

.slide-card__image-preview--desktop {
  aspect-ratio: 21 / 9;
}

.slide-card__image-preview--mobile {
  aspect-ratio: 4 / 5;
  max-height: 150px;
}

.slide-card__image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  gap: 0.25rem;
}

.slide-card__image-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 1.25rem;
}

.slide-card__image-preview:hover .slide-card__image-overlay {
  opacity: 1;
}

.slide-card__link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid #f1f5f9;
  background: #fafbfc;
}
</style>
