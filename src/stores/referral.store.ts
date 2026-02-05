import { defineStore } from 'pinia'
import { ref } from 'vue'
import { referralApi } from '@/api/referral.api'
import type {
  ReferralCode,
  ReferralCodeCreateRequest,
  ReferralCodeUpdateRequest
} from '@/types/referral.types'

export const useReferralStore = defineStore('referral', () => {
  // State
  const referralCodes = ref<ReferralCode[]>([])
  const currentReferralCode = ref<ReferralCode | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // Pagination
  const pagination = ref({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0
  })

  // Actions
  async function fetchReferralCodes(params: {
    page?: number
    search?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
  } = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await referralApi.getAll({
        page: params.page || pagination.value.page,
        per_page: pagination.value.perPage,
        search: params.search,
        sort_by: params.sortBy,
        sort_order: params.sortOrder
      })

      referralCodes.value = response.data
      pagination.value = {
        page: response.meta.page,
        perPage: response.meta.per_page,
        total: response.meta.total,
        totalPages: response.meta.total_pages
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar los códigos de referido'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchReferralCode(id: number): Promise<ReferralCode | null> {
    isLoading.value = true
    error.value = null

    try {
      const referralCode = await referralApi.getById(id)
      currentReferralCode.value = referralCode
      return referralCode
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar el código de referido'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createReferralCode(data: ReferralCodeCreateRequest): Promise<ReferralCode> {
    isSaving.value = true
    error.value = null

    try {
      const referralCode = await referralApi.create(data)
      referralCodes.value.unshift(referralCode)
      pagination.value.total++
      return referralCode
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al crear el código de referido'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function updateReferralCode(id: number, data: ReferralCodeUpdateRequest): Promise<ReferralCode> {
    isSaving.value = true
    error.value = null

    try {
      const referralCode = await referralApi.update(id, data)
      const index = referralCodes.value.findIndex(r => r.tiendacodigoreferido_id === id)
      if (index !== -1) {
        referralCodes.value[index] = referralCode
      }
      return referralCode
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al actualizar el código de referido'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function deleteReferralCode(id: number): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      await referralApi.delete(id)
      referralCodes.value = referralCodes.value.filter(r => r.tiendacodigoreferido_id !== id)
      pagination.value.total--
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al eliminar el código de referido'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  async function toggleReferralCode(id: number): Promise<ReferralCode> {
    try {
      const referralCode = await referralApi.toggle(id)
      const index = referralCodes.value.findIndex(r => r.tiendacodigoreferido_id === id)
      if (index !== -1) {
        referralCodes.value[index] = referralCode
      }
      return referralCode
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cambiar el estado'
      throw err
    }
  }

  async function generateCode(length: number = 10): Promise<string> {
    try {
      return await referralApi.generateCode(length)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al generar el código'
      throw err
    }
  }

  function clearCurrentReferralCode() {
    currentReferralCode.value = null
  }

  return {
    // State
    referralCodes,
    currentReferralCode,
    isLoading,
    isSaving,
    error,
    pagination,

    // Actions
    fetchReferralCodes,
    fetchReferralCode,
    createReferralCode,
    updateReferralCode,
    deleteReferralCode,
    toggleReferralCode,
    generateCode,
    clearCurrentReferralCode
  }
})
