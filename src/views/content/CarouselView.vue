<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCarouselStore } from '@/stores/carousel.store'
import { AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import Dropdown from 'primevue/dropdown'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import CarouselSlideCard from '@/components/carousel/CarouselSlideCard.vue'
import CarouselSlideForm from '@/components/carousel/CarouselSlideForm.vue'
import CarouselImageUploader from '@/components/carousel/CarouselImageUploader.vue'
import {
  DESKTOP_PRESETS,
  MOBILE_PRESETS,
  MAX_SLIDES,
  type CarouselSlide,
  type AspectRatioPreset
} from '@/types/carousel.types'

const store = useCarouselStore()
const confirm = useConfirm()
const toast = useToast()

// Aspect ratio selections
const selectedDesktopPreset = ref<AspectRatioPreset>(DESKTOP_PRESETS[0])
const selectedMobilePreset = ref<AspectRatioPreset>(MOBILE_PRESETS[0])

// Dialog states
const showSlideForm = ref(false)
const editingSlide = ref<CarouselSlide | null>(null)
const showImageUploader = ref(false)
const uploaderDeviceType = ref<'desktop' | 'mobile'>('desktop')
const uploaderSlideId = ref<number | null>(null)

const canAddSlide = computed(() => store.slides.length < MAX_SLIDES)

onMounted(() => {
  store.fetchSlides()
})

// ─── Image Upload ─────────────────────────────────────

const uploaderPreset = computed(() =>
  uploaderDeviceType.value === 'desktop'
    ? selectedDesktopPreset.value
    : selectedMobilePreset.value
)

function openDesktopUploader(slide?: CarouselSlide) {
  uploaderDeviceType.value = 'desktop'
  uploaderSlideId.value = slide?.tiendaimagen_id ?? null
  showImageUploader.value = true
}

function openMobileUploader(slide: CarouselSlide) {
  uploaderDeviceType.value = 'mobile'
  uploaderSlideId.value = slide.tiendaimagen_id
  showImageUploader.value = true
}

async function handleUploadSuccess(data: { blob: Blob; fileName: string }) {
  const file = new File([data.blob], data.fileName, { type: data.blob.type })

  try {
    if (uploaderSlideId.value && uploaderDeviceType.value === 'desktop') {
      // Replace desktop image on existing slide
      await store.uploadDesktopImage(
        uploaderSlideId.value,
        file,
        selectedDesktopPreset.value.value
      )
      toast.add({ severity: 'success', summary: 'Imagen desktop actualizada', life: 3000 })
    } else if (uploaderSlideId.value && uploaderDeviceType.value === 'mobile') {
      // Upload mobile image to existing slide
      await store.uploadMobileImage(
        uploaderSlideId.value,
        file,
        selectedMobilePreset.value.value
      )
      toast.add({ severity: 'success', summary: 'Imagen mobile agregada', life: 3000 })
    } else {
      // Create new slide with desktop image
      await store.createSlide(file, {
        desktop_aspect: selectedDesktopPreset.value.value,
        mobile_aspect: selectedMobilePreset.value.value
      })
      toast.add({ severity: 'success', summary: 'Slide agregado al carrusel', life: 3000 })
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'Error al subir la imagen',
      life: 5000
    })
  }
}

// ─── Slide Metadata ─────────────────────────────────────

function openEditForm(slide: CarouselSlide) {
  editingSlide.value = slide
  showSlideForm.value = true
}

async function handleSaveMetadata(data: { alt_text: string; enlace: string }) {
  if (!editingSlide.value) return

  try {
    await store.updateSlide(editingSlide.value.tiendaimagen_id, data)
    toast.add({ severity: 'success', summary: 'Slide actualizado', life: 3000 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'Error al actualizar',
      life: 5000
    })
  }
}

// ─── Delete ─────────────────────────────────────

function confirmDelete(slide: CarouselSlide) {
  confirm.require({
    message: '¿Estás seguro de eliminar este slide del carrusel?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await store.deleteSlide(slide.tiendaimagen_id)
        toast.add({ severity: 'success', summary: 'Slide eliminado', life: 3000 })
      } catch (e: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: e.message || 'Error al eliminar',
          life: 5000
        })
      }
    }
  })
}

async function handleDeleteMobile(slide: CarouselSlide) {
  try {
    await store.deleteMobileImage(slide.tiendaimagen_id)
    toast.add({ severity: 'success', summary: 'Imagen mobile eliminada', life: 3000 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'Error al eliminar imagen mobile',
      life: 5000
    })
  }
}

// ─── Reorder ─────────────────────────────────────

async function handleMoveUp(slide: CarouselSlide) {
  await store.moveSlideUp(slide.tiendaimagen_id)
}

async function handleMoveDown(slide: CarouselSlide) {
  await store.moveSlideDown(slide.tiendaimagen_id)
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 px-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Carrusel de Portada</h1>
        <p class="text-sm text-gray-500 mt-1">
          Administra las imágenes del carrusel de tu tienda.
          Máximo {{ MAX_SLIDES }} imágenes.
        </p>
      </div>
      <AppButton
        variant="primary"
        icon="pi pi-plus"
        label="Agregar imagen"
        :disabled="!canAddSlide"
        @click="openDesktopUploader()"
      />
    </div>

    <!-- Aspect ratio selectors -->
    <div class="aspect-ratios-bar">
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">
          <i class="pi pi-desktop mr-1"></i>Desktop:
        </label>
        <Dropdown
          v-model="selectedDesktopPreset"
          :options="DESKTOP_PRESETS"
          optionLabel="label"
          class="w-52"
        />
      </div>
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700">
          <i class="pi pi-mobile mr-1"></i>Mobile:
        </label>
        <Dropdown
          v-model="selectedMobilePreset"
          :options="MOBILE_PRESETS"
          optionLabel="label"
          class="w-52"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-20">
      <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error" :message="store.error" @retry="store.fetchSlides" />

    <!-- Empty -->
    <AppEmptyState
      v-else-if="!store.slides.length"
      title="Sin imágenes en el carrusel"
      description="Agrega imágenes al carrusel de portada de tu tienda. Puedes subir hasta 6 imágenes."
      icon="pi pi-images"
    />

    <!-- Slides list -->
    <div v-else class="slides-list">
      <CarouselSlideCard
        v-for="(slide, index) in store.slides"
        :key="slide.tiendaimagen_id"
        :slide="slide"
        :index="index"
        :total-slides="store.slides.length"
        @edit="openEditForm"
        @upload-desktop="openDesktopUploader"
        @upload-mobile="openMobileUploader"
        @delete-mobile="handleDeleteMobile"
        @delete="confirmDelete"
        @move-up="handleMoveUp"
        @move-down="handleMoveDown"
      />
    </div>

    <!-- Slide count -->
    <div v-if="store.slides.length" class="text-center mt-4 text-sm text-gray-500">
      {{ store.slides.length }} / {{ MAX_SLIDES }} imágenes
    </div>

    <!-- Dialogs -->
    <CarouselSlideForm
      v-model:visible="showSlideForm"
      :slide="editingSlide"
      @save="handleSaveMetadata"
    />

    <CarouselImageUploader
      v-model:visible="showImageUploader"
      :device-type="uploaderDeviceType"
      :preset="uploaderPreset"
      :slide-id="uploaderSlideId"
      @upload-success="handleUploadSuccess"
    />

    <ConfirmDialog />
  </div>
</template>

<style scoped>
.aspect-ratios-bar {
  display: flex;
  gap: 2rem;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.slides-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
