import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loyaltyApi } from '@/api/loyalty.api'
import type {
  LoyaltyProgram,
  LoyaltyDashboard,
  LoyaltyAccount,
  LoyaltyEntry,
  LoyaltyCustomerStatus,
  IntegrityResult,
  CorrectionPayload,
} from '@/types/loyalty.types'

export const useLoyaltyStore = defineStore('loyalty', () => {
  // Program config
  const program = ref<LoyaltyProgram | null>(null)
  const isLoadingProgram = ref(false)
  const isSavingProgram = ref(false)

  // Dashboard
  const dashboard = ref<LoyaltyDashboard | null>(null)
  const isLoadingDashboard = ref(false)

  // Customers
  const customers = ref<LoyaltyAccount[]>([])
  const isLoadingCustomers = ref(false)
  const customersPagination = ref({ page: 1, per_page: 20, total: 0, pages: 0 })

  // Customer detail
  const customerStatus = ref<LoyaltyCustomerStatus | null>(null)
  const customerHistory = ref<LoyaltyEntry[]>([])
  const isLoadingCustomerDetail = ref(false)
  const historyPagination = ref({ page: 1, per_page: 50, total: 0, pages: 0 })

  // Integrity
  const integrityResult = ref<IntegrityResult | null>(null)

  // Error
  const error = ref<string | null>(null)

  async function fetchProgram() {
    isLoadingProgram.value = true
    error.value = null
    try {
      program.value = await loyaltyApi.getProgram()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar el programa'
    } finally {
      isLoadingProgram.value = false
    }
  }

  async function saveProgram(data: Partial<LoyaltyProgram>) {
    isSavingProgram.value = true
    error.value = null
    try {
      program.value = await loyaltyApi.saveProgram(data)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar'
      return false
    } finally {
      isSavingProgram.value = false
    }
  }

  async function fetchDashboard() {
    isLoadingDashboard.value = true
    try {
      dashboard.value = await loyaltyApi.getDashboard()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar estadísticas'
    } finally {
      isLoadingDashboard.value = false
    }
  }

  async function fetchCustomers(params: { search?: string; page?: number } = {}) {
    isLoadingCustomers.value = true
    try {
      const response = await loyaltyApi.getCustomers(params)
      customers.value = response.data
      customersPagination.value = response.pagination
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar clientes'
    } finally {
      isLoadingCustomers.value = false
    }
  }

  async function fetchCustomerDetail(customerId: number) {
    isLoadingCustomerDetail.value = true
    try {
      customerStatus.value = await loyaltyApi.getCustomerDetail(customerId)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar detalle del cliente'
    } finally {
      isLoadingCustomerDetail.value = false
    }
  }

  async function fetchCustomerHistory(customerId: number, page = 1) {
    isLoadingCustomerDetail.value = true
    try {
      const response = await loyaltyApi.getCustomerHistory(customerId, { page })
      customerHistory.value = response.data
      historyPagination.value = response.pagination
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al cargar historial'
    } finally {
      isLoadingCustomerDetail.value = false
    }
  }

  async function applyCorrection(customerId: number, data: CorrectionPayload) {
    try {
      await loyaltyApi.applyCorrection(customerId, data)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al aplicar corrección'
      return false
    }
  }

  async function verifyIntegrity(customerId: number) {
    try {
      integrityResult.value = await loyaltyApi.verifyIntegrity(customerId)
      return integrityResult.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al verificar integridad'
      return null
    }
  }

  return {
    program,
    isLoadingProgram,
    isSavingProgram,
    dashboard,
    isLoadingDashboard,
    customers,
    isLoadingCustomers,
    customersPagination,
    customerStatus,
    customerHistory,
    isLoadingCustomerDetail,
    historyPagination,
    integrityResult,
    error,
    fetchProgram,
    saveProgram,
    fetchDashboard,
    fetchCustomers,
    fetchCustomerDetail,
    fetchCustomerHistory,
    applyCorrection,
    verifyIntegrity,
  }
})
