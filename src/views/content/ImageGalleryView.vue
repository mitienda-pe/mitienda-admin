<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Galería de Imágenes</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ galleryStore.pagination.total }} imágenes
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="flex-1">
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Buscar por título o texto alternativo..."
            class="w-full"
            @input="handleSearch"
          />
        </IconField>
      </div>
      <Dropdown
        v-model="sourceFilter"
        :options="sourceOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full sm:w-48"
        @change="handleSourceChange"
      />
    </div>

    <!-- Loading -->
    <div v-if="galleryStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="galleryStore.error" severity="error" :closable="false">
      {{ galleryStore.error }}
    </Message>

    <!-- Gallery Grid -->
    <div v-else-if="galleryStore.images.length > 0">
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <div
          v-for="img in galleryStore.images"
          :key="`${img.source}-${img.id}`"
          class="group relative bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          @click="openDetail(img)"
        >
          <!-- Thumbnail -->
          <div class="aspect-square bg-gray-100 overflow-hidden">
            <img
              v-if="img.thumbnail_url"
              :src="img.thumbnail_url"
              :alt="img.alt_text || img.title || ''"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
              @error="handleImageError"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <i class="pi pi-image text-3xl text-secondary-300"></i>
            </div>
          </div>

          <!-- Info -->
          <div class="p-2">
            <p class="text-xs text-secondary-700 truncate">
              {{ img.title || 'Sin título' }}
            </p>
            <div class="flex items-center gap-1 mt-1">
              <span
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                :class="{
                  'bg-blue-100 text-blue-700': img.source === 'r2',
                  'bg-green-100 text-green-700': img.source === 'cloudflare',
                  'bg-gray-100 text-gray-600': img.source === 'legacy',
                }"
              >
                {{ img.source === 'r2' ? 'R2' : img.source === 'cloudflare' ? 'CF' : 'S3' }}
              </span>
              <span v-if="img.width && img.height" class="text-[10px] text-secondary-400">
                {{ img.width }}×{{ img.height }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6 flex justify-center">
        <Paginator
          :rows="galleryStore.pagination.perPage"
          :totalRecords="galleryStore.pagination.total"
          :first="(galleryStore.pagination.page - 1) * galleryStore.pagination.perPage"
          @page="handlePageChange"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-images text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay imágenes</h3>
      <p class="text-secondary-500">
        {{ searchQuery ? 'No se encontraron imágenes con ese criterio' : 'No se encontraron imágenes en esta tienda' }}
      </p>
    </div>

    <!-- Detail Dialog -->
    <ImageDetailDialog
      v-model:visible="showDetail"
      :imageId="selectedImageId"
      :imageSource="selectedImageSource"
      @metadata-updated="galleryStore.fetchImages(galleryStore.pagination.page)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useImageGalleryStore } from '@/stores/image-gallery.store'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import Dropdown from 'primevue/dropdown'
import ImageDetailDialog from '@/components/images/ImageDetailDialog.vue'
import type { GalleryImage, ImageSource } from '@/types/gallery-image.types'

const galleryStore = useImageGalleryStore()

const searchQuery = ref('')
const sourceFilter = ref<'all' | ImageSource>('all')
const showDetail = ref(false)
const selectedImageId = ref<number | null>(null)
const selectedImageSource = ref<ImageSource | null>(null)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const sourceOptions = [
  { label: 'Todas las fuentes', value: 'all' },
  { label: 'R2 CDN', value: 'r2' },
  { label: 'Cloudflare', value: 'cloudflare' },
  { label: 'Legacy S3', value: 'legacy' },
]

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    galleryStore.setSearch(searchQuery.value)
    galleryStore.fetchImages(1)
  }, 400)
}

const handleSourceChange = () => {
  galleryStore.setSourceFilter(sourceFilter.value)
  galleryStore.fetchImages(1)
}

const handlePageChange = (event: { page: number }) => {
  galleryStore.fetchImages(event.page + 1)
}

const openDetail = (img: GalleryImage) => {
  selectedImageId.value = img.id
  selectedImageSource.value = img.source
  showDetail.value = true
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

onMounted(() => {
  galleryStore.fetchImages(1)
})
</script>
