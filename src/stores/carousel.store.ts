import { ref } from 'vue'
import { defineStore } from 'pinia'
import { carouselApi } from '@/api/carousel.api'
import type { CarouselSlide, CarouselSlideFormData } from '@/types/carousel.types'

export const useCarouselStore = defineStore('carousel', () => {
  const slides = ref<CarouselSlide[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSlides() {
    loading.value = true
    error.value = null
    try {
      const response = await carouselApi.getAll()
      if (response.success && response.data) {
        slides.value = response.data
      }
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || 'Error al cargar el carrusel'
    } finally {
      loading.value = false
    }
  }

  async function createSlide(
    image: File,
    data: {
      alt_text?: string
      enlace?: string
      desktop_aspect: string
      mobile_aspect?: string
    }
  ): Promise<CarouselSlide> {
    const response = await carouselApi.create(image, data)
    if (response.success && response.data) {
      await fetchSlides()
      return response.data
    }
    throw new Error(response.message || 'Error al crear el slide')
  }

  async function updateSlide(imagenId: number, data: CarouselSlideFormData) {
    const response = await carouselApi.update(imagenId, data)
    if (response.success && response.data) {
      const index = slides.value.findIndex(s => s.tiendaimagen_id === imagenId)
      if (index !== -1) {
        slides.value[index] = response.data
      }
      return response.data
    }
    throw new Error(response.message || 'Error al actualizar el slide')
  }

  async function deleteSlide(imagenId: number) {
    await carouselApi.delete(imagenId)
    slides.value = slides.value.filter(s => s.tiendaimagen_id !== imagenId)
  }

  async function uploadDesktopImage(imagenId: number, file: File, desktopAspect: string) {
    const response = await carouselApi.uploadDesktop(imagenId, file, desktopAspect)
    if (response.success && response.data) {
      const index = slides.value.findIndex(s => s.tiendaimagen_id === imagenId)
      if (index !== -1) {
        slides.value[index] = response.data
      }
      return response.data
    }
    throw new Error(response.message || 'Error al subir imagen desktop')
  }

  async function uploadMobileImage(imagenId: number, file: File, mobileAspect: string) {
    const response = await carouselApi.uploadMobile(imagenId, file, mobileAspect)
    if (response.success && response.data) {
      const index = slides.value.findIndex(s => s.tiendaimagen_id === imagenId)
      if (index !== -1) {
        slides.value[index] = response.data
      }
      return response.data
    }
    throw new Error(response.message || 'Error al subir imagen mobile')
  }

  async function deleteMobileImage(imagenId: number) {
    await carouselApi.deleteMobileImage(imagenId)
    const index = slides.value.findIndex(s => s.tiendaimagen_id === imagenId)
    if (index !== -1) {
      slides.value[index].tiendacarruselimagen_mobile_r2_url = null
      slides.value[index].tiendacarruselimagen_mobile_aspect = null
    }
  }

  async function moveSlideUp(imagenId: number) {
    const index = slides.value.findIndex(s => s.tiendaimagen_id === imagenId)
    if (index <= 0) return

    const temp = slides.value[index]
    slides.value[index] = slides.value[index - 1]
    slides.value[index - 1] = temp

    await _saveOrder()
  }

  async function moveSlideDown(imagenId: number) {
    const index = slides.value.findIndex(s => s.tiendaimagen_id === imagenId)
    if (index === -1 || index >= slides.value.length - 1) return

    const temp = slides.value[index]
    slides.value[index] = slides.value[index + 1]
    slides.value[index + 1] = temp

    await _saveOrder()
  }

  async function _saveOrder() {
    const items = slides.value.map((s, i) => ({
      tiendaimagen_id: s.tiendaimagen_id,
      orden: i + 1
    }))

    try {
      await carouselApi.reorder(items)
    } catch (e: any) {
      console.error('Error saving order:', e)
      await fetchSlides()
    }
  }

  return {
    slides,
    loading,
    error,
    fetchSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    uploadDesktopImage,
    uploadMobileImage,
    deleteMobileImage,
    moveSlideUp,
    moveSlideDown
  }
})
