import { ref } from 'vue'
import { defineStore } from 'pinia'
import { legalPagesApi } from '@/api/legal-pages.api'
import type { LegalPageSummary, LegalPageDetail } from '@/types/legal-page.types'

export const useLegalPagesStore = defineStore('legal-pages', () => {
  const pages = ref<LegalPageSummary[]>([])
  const currentPage = ref<LegalPageDetail | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPages() {
    try {
      isLoading.value = true
      error.value = null
      pages.value = await legalPagesApi.getAll()
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar páginas legales'
      console.error('Failed to fetch legal pages:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPage(slug: string) {
    try {
      isLoading.value = true
      error.value = null
      currentPage.value = await legalPagesApi.getBySlug(slug)
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar página legal'
      console.error('Failed to fetch legal page:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function updatePage(slug: string, content: string) {
    await legalPagesApi.update(slug, content)

    // Update local state
    if (currentPage.value?.slug === slug) {
      currentPage.value.content = content
    }
    const idx = pages.value.findIndex((p) => p.slug === slug)
    if (idx !== -1) {
      const plainText = content.replace(/<[^>]*>/g, '')
      pages.value[idx].hasContent = plainText.trim().length > 0
      pages.value[idx].contentPreview = plainText.trim().substring(0, 200) || null
    }
  }

  return {
    pages,
    currentPage,
    isLoading,
    error,
    fetchPages,
    fetchPage,
    updatePage,
  }
})
