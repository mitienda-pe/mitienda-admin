import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import { imageGalleryApi } from '@/api/image-gallery.api'
import type {
  GalleryImage,
  GalleryImageDetail,
  GalleryPagination,
  GalleryFilters,
  ImageMetadataUpdate,
  ImageSource,
} from '@/types/gallery-image.types'

export const useImageGalleryStore = defineStore('image-gallery', () => {
  const images = ref<GalleryImage[]>([])
  const selectedImage = ref<GalleryImageDetail | null>(null)
  const isLoading = ref(false)
  const isLoadingDetail = ref(false)
  const error = ref<string | null>(null)

  const pagination = reactive<GalleryPagination>({
    page: 1,
    perPage: 24,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  const filters = reactive<GalleryFilters>({
    search: '',
    source: 'all',
  })

  async function fetchImages(page: number = 1) {
    try {
      isLoading.value = true
      error.value = null

      const result = await imageGalleryApi.getAll({
        page,
        limit: pagination.perPage,
        search: filters.search || undefined,
        source: filters.source,
      })

      images.value = result.data
      Object.assign(pagination, result.pagination)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar imágenes'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchImageDetail(id: number, source: ImageSource) {
    try {
      isLoadingDetail.value = true
      selectedImage.value = await imageGalleryApi.getById(id, source)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar detalle de imagen'
    } finally {
      isLoadingDetail.value = false
    }
  }

  async function updateMetadata(id: number, source: ImageSource, data: ImageMetadataUpdate) {
    await imageGalleryApi.updateMetadata(id, source, data)
    // Update in list if present
    const idx = images.value.findIndex((img) => img.id === id && img.source === source)
    if (idx !== -1) {
      if (data.title !== undefined) images.value[idx].title = data.title
      if (data.alt_text !== undefined) images.value[idx].alt_text = data.alt_text
      if (data.description !== undefined) images.value[idx].description = data.description
    }
    // Update selected if same
    if (selectedImage.value?.id === id && selectedImage.value?.source === source) {
      if (data.title !== undefined) selectedImage.value.title = data.title
      if (data.alt_text !== undefined) selectedImage.value.alt_text = data.alt_text
      if (data.description !== undefined) selectedImage.value.description = data.description
    }
  }

  function setSearch(query: string) {
    filters.search = query
  }

  function setSourceFilter(source: GalleryFilters['source']) {
    filters.source = source
  }

  function clearSelectedImage() {
    selectedImage.value = null
  }

  return {
    images,
    selectedImage,
    isLoading,
    isLoadingDetail,
    error,
    pagination,
    filters,
    fetchImages,
    fetchImageDetail,
    updateMetadata,
    setSearch,
    setSourceFilter,
    clearSelectedImage,
  }
})
