import apiClient from './axios'
import type { CarouselSlide, CarouselSlideFormData } from '@/types/carousel.types'
import type { ApiResponse } from '@/types/api.types'

export const carouselApi = {
  async getAll(): Promise<ApiResponse<CarouselSlide[]>> {
    const response = await apiClient.get('/carousel')
    return response.data
  },

  async getById(imagenId: number): Promise<ApiResponse<CarouselSlide>> {
    const response = await apiClient.get(`/carousel/${imagenId}`)
    return response.data
  },

  async create(
    image: File,
    data: {
      alt_text?: string
      enlace?: string
      desktop_aspect: string
      mobile_aspect?: string
    }
  ): Promise<ApiResponse<CarouselSlide>> {
    const formData = new FormData()
    formData.append('image', image)
    if (data.alt_text) formData.append('alt_text', data.alt_text)
    if (data.enlace) formData.append('enlace', data.enlace)
    formData.append('desktop_aspect', data.desktop_aspect)
    if (data.mobile_aspect) formData.append('mobile_aspect', data.mobile_aspect)

    const response = await apiClient.post('/carousel', formData)
    return response.data
  },

  async update(
    imagenId: number,
    data: CarouselSlideFormData
  ): Promise<ApiResponse<CarouselSlide>> {
    const response = await apiClient.put(`/carousel/${imagenId}`, data)
    return response.data
  },

  async delete(imagenId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/carousel/${imagenId}`)
    return response.data
  },

  async uploadDesktop(
    imagenId: number,
    file: File,
    desktopAspect: string
  ): Promise<ApiResponse<CarouselSlide>> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('desktop_aspect', desktopAspect)

    const response = await apiClient.post(`/carousel/${imagenId}/upload-desktop`, formData)
    return response.data
  },

  async uploadMobile(
    imagenId: number,
    file: File,
    mobileAspect: string
  ): Promise<ApiResponse<CarouselSlide>> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('mobile_aspect', mobileAspect)

    const response = await apiClient.post(`/carousel/${imagenId}/upload-mobile`, formData)
    return response.data
  },

  async deleteMobileImage(imagenId: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/carousel/${imagenId}/mobile-image`)
    return response.data
  },

  async reorder(
    items: { tiendaimagen_id: number; orden: number }[]
  ): Promise<ApiResponse<CarouselSlide[]>> {
    const response = await apiClient.put('/carousel/reorder', { items })
    return response.data
  }
}
