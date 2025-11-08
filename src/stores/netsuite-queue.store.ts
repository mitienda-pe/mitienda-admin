/**
 * NetSuite Queue Management Store
 * Manages state for queue jobs, failed jobs, and statistics
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { netsuiteQueueApi } from '@/api/netsuite-queue.api'
import type {
  QueueStats,
  QueueJob,
  FailedJob,
  JobStatus,
  QueueFilters
} from '@/types/netsuite-queue.types'

export const useNetsuiteQueueStore = defineStore('netsuite-queue', () => {
  // State - Queue Stats
  const stats = ref<QueueStats | null>(null)
  const isLoadingStats = ref(false)
  const statsError = ref<string | null>(null)

  // State - Active Jobs
  const jobs = ref<QueueJob[]>([])
  const jobsCount = ref(0)
  const isLoadingJobs = ref(false)
  const jobsError = ref<string | null>(null)

  // State - Failed Jobs
  const failedJobs = ref<FailedJob[]>([])
  const failedJobsCount = ref(0)
  const isLoadingFailedJobs = ref(false)
  const failedJobsError = ref<string | null>(null)

  // State - Filters
  const filters = ref<QueueFilters>({
    queue: undefined, // Sin filtro por defecto para ver todas las colas
    status: 'all',
    limit: 50
  })

  // State - Auto-refresh
  const autoRefreshInterval = ref<number | null>(null)
  const isAutoRefreshEnabled = ref(false)

  // Getters
  const hasJobs = computed(() => jobs.value.length > 0)
  const hasFailedJobs = computed(() => failedJobs.value.length > 0)
  const totalPendingJobs = computed(() => {
    if (!stats.value) return 0
    return stats.value.pending_jobs.reduce((sum, item) => sum + item.count, 0)
  })
  const totalReservedJobs = computed(() => {
    if (!stats.value) return 0
    return stats.value.reserved_jobs.reduce((sum, item) => sum + item.count, 0)
  })
  const hasOldPendingJobs = computed(() => {
    if (!stats.value || !stats.value.oldest_pending_age_seconds) return false
    // Alert if oldest pending job is older than 5 minutes (300 seconds)
    return stats.value.oldest_pending_age_seconds > 300
  })

  // Actions - Fetch Queue Stats
  async function fetchQueueStats() {
    try {
      isLoadingStats.value = true
      statsError.value = null
      console.log('[Queue Store] Fetching queue stats...')

      const response = await netsuiteQueueApi.getQueueStatus()

      if (response.success && response.data) {
        stats.value = response.data
        console.log('[Queue Store] Stats loaded:', stats.value)
      } else {
        throw new Error(response.message || 'Error al cargar estadísticas de la cola')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error fetching stats:', error)
      statsError.value = error.message || 'Error al cargar estadísticas'
    } finally {
      isLoadingStats.value = false
    }
  }

  // Actions - Fetch Queue Jobs
  async function fetchQueueJobs(forceRefresh = false) {
    if (isLoadingJobs.value && !forceRefresh) return

    try {
      isLoadingJobs.value = true
      jobsError.value = null
      console.log('[Queue Store] Fetching queue jobs...', filters.value)

      const response = await netsuiteQueueApi.getQueueJobs(
        filters.value.queue,
        filters.value.status,
        filters.value.limit
      )

      if (response.success && response.data) {
        jobs.value = response.data.jobs
        jobsCount.value = response.data.count
        console.log('[Queue Store] Jobs loaded:', jobsCount.value)
      } else {
        throw new Error(response.message || 'Error al cargar trabajos de la cola')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error fetching jobs:', error)

      // Mensaje de error más específico
      let errorMsg = 'Error al cargar trabajos de la cola'
      if (error.response?.data?.messages?.error) {
        const backendError = error.response.data.messages.error
        if (backendError.includes('EmailJob')) {
          errorMsg = 'La cola "emails" tiene trabajos corruptos. Intenta filtrar por cola "netsuite" o deja el filtro vacío.'
        } else {
          errorMsg = backendError
        }
      } else if (error.message) {
        errorMsg = error.message
      }

      jobsError.value = errorMsg
    } finally {
      isLoadingJobs.value = false
    }
  }

  // Actions - Fetch Failed Jobs
  async function fetchFailedJobs() {
    try {
      isLoadingFailedJobs.value = true
      failedJobsError.value = null
      console.log('[Queue Store] Fetching failed jobs...')

      const response = await netsuiteQueueApi.getFailedJobs(filters.value.limit)

      if (response.success && response.data) {
        failedJobs.value = response.data.failed_jobs
        failedJobsCount.value = response.data.count
        console.log('[Queue Store] Failed jobs loaded:', failedJobsCount.value)
      } else {
        throw new Error(response.message || 'Error al cargar trabajos fallidos')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error fetching failed jobs:', error)
      failedJobsError.value = error.message || 'Error al cargar trabajos fallidos'
    } finally {
      isLoadingFailedJobs.value = false
    }
  }

  // Actions - Retry Failed Job
  async function retryFailedJob(failedJobId: number): Promise<boolean> {
    try {
      console.log('[Queue Store] Retrying failed job:', failedJobId)

      const response = await netsuiteQueueApi.retryFailedJob(failedJobId)

      if (response.success) {
        console.log('[Queue Store] Job retried successfully:', failedJobId)
        // Refresh both lists
        await Promise.all([fetchFailedJobs(), fetchQueueJobs(), fetchQueueStats()])
        return true
      } else {
        throw new Error(response.message || 'Error al reintentar trabajo')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error retrying job:', error)
      throw error
    }
  }

  // Actions - Retry All Failed Jobs
  async function retryAllFailedJobs(): Promise<number> {
    try {
      console.log('[Queue Store] Retrying all failed jobs...')

      const response = await netsuiteQueueApi.retryAllFailedJobs()

      if (response.success && response.data) {
        const retriedCount = response.data.retried_count
        console.log('[Queue Store] All jobs retried:', retriedCount)
        // Refresh all lists
        await Promise.all([fetchFailedJobs(), fetchQueueJobs(), fetchQueueStats()])
        return retriedCount
      } else {
        throw new Error(response.message || 'Error al reintentar todos los trabajos')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error retrying all jobs:', error)
      throw error
    }
  }

  // Actions - Delete Queue Job
  async function deleteQueueJob(jobId: number): Promise<boolean> {
    try {
      console.log('[Queue Store] Deleting queue job:', jobId)

      const response = await netsuiteQueueApi.deleteQueueJob(jobId)

      if (response.success) {
        console.log('[Queue Store] Job deleted successfully:', jobId)
        // Refresh lists
        await Promise.all([fetchQueueJobs(), fetchQueueStats()])
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar trabajo')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error deleting job:', error)
      throw error
    }
  }

  // Actions - Delete Failed Job
  async function deleteFailedJob(failedJobId: number): Promise<boolean> {
    try {
      console.log('[Queue Store] Deleting failed job:', failedJobId)

      const response = await netsuiteQueueApi.deleteFailedJob(failedJobId)

      if (response.success) {
        console.log('[Queue Store] Failed job deleted successfully:', failedJobId)
        // Refresh lists
        await Promise.all([fetchFailedJobs(), fetchQueueStats()])
        return true
      } else {
        throw new Error(response.message || 'Error al eliminar trabajo fallido')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error deleting failed job:', error)
      throw error
    }
  }

  // Actions - Clear All Failed Jobs
  async function clearAllFailedJobs(): Promise<number> {
    try {
      console.log('[Queue Store] Clearing all failed jobs...')

      const response = await netsuiteQueueApi.clearAllFailedJobs()

      if (response.success && response.data) {
        const deletedCount = response.data.deleted_count
        console.log('[Queue Store] All failed jobs cleared:', deletedCount)
        // Refresh lists
        await Promise.all([fetchFailedJobs(), fetchQueueStats()])
        return deletedCount
      } else {
        throw new Error(response.message || 'Error al limpiar trabajos fallidos')
      }
    } catch (error: any) {
      console.error('[Queue Store] Error clearing failed jobs:', error)
      throw error
    }
  }

  // Actions - Update Filters
  function updateFilters(newFilters: Partial<QueueFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    console.log('[Queue Store] Filters updated:', filters.value)
  }

  // Actions - Refresh All Data
  async function refreshAll() {
    console.log('[Queue Store] Refreshing all data...')
    await Promise.all([fetchQueueStats(), fetchQueueJobs(), fetchFailedJobs()])
  }

  // Actions - Auto-Refresh
  function startAutoRefresh(intervalSeconds = 30) {
    if (autoRefreshInterval.value) {
      stopAutoRefresh()
    }

    isAutoRefreshEnabled.value = true
    autoRefreshInterval.value = window.setInterval(() => {
      console.log('[Queue Store] Auto-refreshing...')
      refreshAll()
    }, intervalSeconds * 1000)

    console.log(`[Queue Store] Auto-refresh started (${intervalSeconds}s)`)
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
      isAutoRefreshEnabled.value = false
      console.log('[Queue Store] Auto-refresh stopped')
    }
  }

  // Actions - Clear Errors
  function clearErrors() {
    statsError.value = null
    jobsError.value = null
    failedJobsError.value = null
  }

  return {
    // State
    stats,
    isLoadingStats,
    statsError,
    jobs,
    jobsCount,
    isLoadingJobs,
    jobsError,
    failedJobs,
    failedJobsCount,
    isLoadingFailedJobs,
    failedJobsError,
    filters,
    isAutoRefreshEnabled,

    // Getters
    hasJobs,
    hasFailedJobs,
    totalPendingJobs,
    totalReservedJobs,
    hasOldPendingJobs,

    // Actions
    fetchQueueStats,
    fetchQueueJobs,
    fetchFailedJobs,
    retryFailedJob,
    retryAllFailedJobs,
    deleteQueueJob,
    deleteFailedJob,
    clearAllFailedJobs,
    updateFilters,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh,
    clearErrors
  }
})
