import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { complaintsApi } from '@/api/complaints.api'
import type { Complaint, ComplaintFilters, ComplaintStats } from '@/types/complaint.types'

export const useComplaintsStore = defineStore('complaints', () => {
  // State
  const complaints = ref<Complaint[]>([])
  const currentComplaint = ref<Complaint | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<ComplaintStats | null>(null)

  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  })

  const sorting = ref({
    field: 'date',
    order: 'desc' as 'asc' | 'desc',
  })

  const filters = ref<ComplaintFilters>({
    search: '',
    status: '',
    type: '',
  })

  // Getters
  const hasComplaints = computed(() => complaints.value.length > 0)
  const pendingCount = computed(() => stats.value?.pending ?? 0)

  // Actions
  async function fetchComplaints() {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const response = await complaintsApi.getComplaints({
        page: pagination.value.page,
        limit: pagination.value.limit,
        search: filters.value.search || undefined,
        status: filters.value.status || undefined,
        type: filters.value.type || undefined,
        sort: sorting.value.field,
        order: sorting.value.order,
      })

      if (response.success && response.data) {
        complaints.value = response.data
        pagination.value.total = response.meta?.total || 0
        pagination.value.totalPages = response.meta?.totalPages || 1
        pagination.value.hasMore = response.meta?.hasMore || false
      } else {
        throw new Error('Error al cargar reclamaciones')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching complaints:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchComplaint(id: number) {
    try {
      isLoading.value = true
      error.value = null

      const response = await complaintsApi.getComplaint(id)
      if (response.success && response.data) {
        currentComplaint.value = response.data
      } else {
        throw new Error('Error al cargar reclamación')
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido'
      console.error('Error fetching complaint:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStats() {
    try {
      const response = await complaintsApi.getStats()
      if (response.success && response.data) {
        stats.value = response.data
      }
    } catch (err) {
      console.error('Error fetching complaint stats:', err)
    }
  }

  async function respondToComplaint(id: number, responseText: string) {
    try {
      const response = await complaintsApi.respond(id, responseText)
      if (response.success) {
        if (currentComplaint.value?.id === id) {
          currentComplaint.value.response = responseText
          currentComplaint.value.response_date = new Date().toISOString()
          currentComplaint.value.status = 'attended'
        }
        await fetchStats()
        return true
      }
    } catch (err) {
      console.error('Error responding to complaint:', err)
      throw err
    }
    return false
  }

  function setPage(page: number) {
    pagination.value.page = page
    fetchComplaints()
  }

  function setSort(field: string, order: 'asc' | 'desc') {
    sorting.value.field = field
    sorting.value.order = order
    pagination.value.page = 1
    fetchComplaints()
  }

  function setStatusFilter(status: ComplaintFilters['status']) {
    filters.value.status = status
    pagination.value.page = 1
    fetchComplaints()
  }

  function setTypeFilter(type: ComplaintFilters['type']) {
    filters.value.type = type
    pagination.value.page = 1
    fetchComplaints()
  }

  function setSearch(query: string) {
    filters.value.search = query
    pagination.value.page = 1
    fetchComplaints()
  }

  function resetFilters() {
    filters.value = { search: '', status: '', type: '' }
    pagination.value.page = 1
    fetchComplaints()
  }

  function clearCurrentComplaint() {
    currentComplaint.value = null
  }

  return {
    complaints,
    currentComplaint,
    isLoading,
    error,
    stats,
    pagination,
    sorting,
    filters,
    hasComplaints,
    pendingCount,
    fetchComplaints,
    fetchComplaint,
    fetchStats,
    respondToComplaint,
    setPage,
    setSort,
    setStatusFilter,
    setTypeFilter,
    setSearch,
    resetFilters,
    clearCurrentComplaint,
  }
})
