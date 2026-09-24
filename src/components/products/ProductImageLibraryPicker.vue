<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'
import { imageGalleryApi } from '@/api/image-gallery.api'
import type { GalleryImage } from '@/types/gallery-image.types'
import type { ProductImage } from '@/types/product.types'

/**
 * Selector de imágenes de Contenido › Imágenes para vincularlas a un producto.
 * No usa el store de la galería para no pisar los filtros/página de esa vista.
 */

interface Props {
  selected: GalleryImage | null
  linkedImages?: ProductImage[]
  minWidth: number
  minHeight: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selected': [image: GalleryImage | null]
}>()

const PER_PAGE = 18

const images = ref<GalleryImage[]>([])
const total = ref(0)
const page = ref(1)
const search = ref('')
const isLoading = ref(false)
const loadError = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const fetchImages = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const result = await imageGalleryApi.getAll({
      page: page.value,
      limit: PER_PAGE,
      search: search.value || undefined,
    })
    images.value = result.data
    total.value = result.pagination.total
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'No se pudieron cargar las imágenes'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    emit('update:selected', null)
    fetchImages()
  }, 400)
}

const handlePageChange = (event: { page: number }) => {
  page.value = event.page + 1
  fetchImages()
}

const isLinked = (img: GalleryImage) =>
  (props.linkedImages || []).some(
    (linked) =>
      linked.source === img.source &&
      (linked.id === img.id || (img.source === 'r2' && linked.r2_imagen_id === img.id))
  )

/** Motivo por el que no se puede elegir, o null si se puede. */
const disabledReason = (img: GalleryImage): string | null => {
  if (img.source === 'cloudflare') return 'Formato antiguo'
  if (isLinked(img)) return 'Ya está en el producto'
  if (img.width && img.height && (img.width < props.minWidth || img.height < props.minHeight)) {
    return `Menor a ${props.minWidth}×${props.minHeight}`
  }
  return null
}

const isSelected = (img: GalleryImage) =>
  props.selected?.id === img.id && props.selected?.source === img.source

const handleSelect = (img: GalleryImage) => {
  if (disabledReason(img)) return
  emit('update:selected', isSelected(img) ? null : img)
}

const handleImageError = (event: Event) => {
  (event.target as HTMLImageElement).style.display = 'none'
}

onMounted(fetchImages)

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<template>
  <div class="space-y-3">
    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText
        v-model="search"
        placeholder="Buscar por título o texto alternativo..."
        class="w-full"
        @input="handleSearch"
      />
    </IconField>

    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else-if="loadError" class="text-sm text-red-600 py-6 text-center">
      {{ loadError }}
    </div>

    <div v-else-if="images.length === 0" class="py-10 text-center text-secondary-500">
      <i class="pi pi-images text-4xl text-secondary-300 mb-2"></i>
      <p class="text-sm">
        {{ search ? 'No se encontraron imágenes con ese criterio' : 'Todavía no hay imágenes en la galería' }}
      </p>
    </div>

    <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      <button
        v-for="img in images"
        :key="`${img.source}-${img.id}`"
        type="button"
        class="picker-item"
        :class="{
          'picker-item--selected': isSelected(img),
          'picker-item--disabled': !!disabledReason(img),
        }"
        :disabled="!!disabledReason(img)"
        :title="disabledReason(img) || img.title || 'Sin título'"
        :aria-pressed="isSelected(img)"
        @click="handleSelect(img)"
      >
        <img
          v-if="img.thumbnail_url"
          :src="img.thumbnail_url"
          :alt="img.alt_text || img.title || ''"
          loading="lazy"
          @error="handleImageError"
        />
        <i v-else class="pi pi-image text-2xl text-secondary-300"></i>

        <span v-if="isSelected(img)" class="picker-check">
          <i class="pi pi-check"></i>
        </span>
        <span v-else-if="disabledReason(img)" class="picker-reason">
          {{ disabledReason(img) }}
        </span>
      </button>
    </div>

    <Paginator
      v-if="total > PER_PAGE"
      :rows="PER_PAGE"
      :totalRecords="total"
      :first="(page - 1) * PER_PAGE"
      template="PrevPageLink CurrentPageReport NextPageLink"
      currentPageReportTemplate="{currentPage} de {totalPages}"
      @page="handlePageChange"
    />
  </div>
</template>

<style scoped>
.picker-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.15s;
}

.picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picker-item:hover:not(:disabled) {
  border-color: #94a3b8;
}

.picker-item:focus-visible {
  outline: 2px solid #00b2a6;
  outline-offset: 2px;
}

.picker-item--selected,
.picker-item--selected:hover:not(:disabled) {
  border-color: #00b2a6;
}

.picker-item--disabled {
  cursor: not-allowed;
}

.picker-item--disabled img {
  opacity: 0.4;
}

.picker-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 9999px;
  background: #00b2a6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.picker-reason {
  position: absolute;
  inset: auto 0 0 0;
  padding: 2px 4px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  font-size: 10px;
  line-height: 1.3;
  text-align: center;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}
</style>
