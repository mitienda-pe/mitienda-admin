import apiClient from './axios'
import type {
  GalleryImage,
  GalleryImageDetail,
  GalleryPagination,
  ImageMetadataUpdate,
  ImageSource,
} from '@/types/gallery-image.types'

interface GalleryListParams {
  page?: number
  limit?: number
  search?: string
  source?: 'all' | ImageSource
}

interface GalleryListResponse {
  data: GalleryImage[]
  pagination: GalleryPagination
}

export const imageGalleryApi = {
  async getAll(params: GalleryListParams = {}): Promise<GalleryListResponse> {
    const queryParams: Record<string, string | number> = {}
    if (params.page) queryParams.page = params.page
    if (params.limit) queryParams.limit = params.limit
    if (params.search) queryParams.search = params.search
    if (params.source && params.source !== 'all') queryParams.source = params.source

    const response = await apiClient.get('/image-gallery', { params: queryParams })
    return {
      data: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        perPage: 24,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    }
  },

  async getById(id: number, source: ImageSource): Promise<GalleryImageDetail> {
    const response = await apiClient.get(`/image-gallery/${id}`, {
      params: { source },
    })
    return response.data.data
  },

  async updateMetadata(
    id: number,
    source: ImageSource,
    data: ImageMetadataUpdate
  ): Promise<void> {
    await apiClient.put(`/image-gallery/${id}`, data, {
      params: { source },
    })
  },

  async uploadImage(file: File, title?: string): Promise<{ r2_imagen_id: number; r2_key: string; url: string }> {
    const formData = new FormData()
    formData.append('image', file)
    if (title) formData.append('title', title)

    const response = await apiClient.post('/image-gallery/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.data
  },

  async deleteR2Image(id: number): Promise<void> {
    await apiClient.delete(`/image-gallery/r2/${id}`)
  },
}
