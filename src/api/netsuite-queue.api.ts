/**
 * NetSuite Queue Management API
 * Based on API documentation: docs/QUEUE_MANAGEMENT_API.md
 */

import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  QueueStats,
  QueueJobsResponse,
  FailedJobsResponse,
  RetryJobResponse,
  RetryAllResponse,
  DeleteJobResponse,
  ClearFailedResponse,
  JobStatus
} from '@/types/netsuite-queue.types'

export const netsuiteQueueApi = {
  /**
   * GET /api/v1/queue/status
   * Get general status of all queues
   */
  async getQueueStatus(): Promise<ApiResponse<QueueStats>> {
    const response = await apiClient.get('/queue/status')
    return response.data
  },

  /**
   * GET /api/v1/queue/jobs
   * List jobs in queue (pending or processing)
   *
   * @param queue - Filter by queue name (e.g., 'netsuite')
   * @param status - Filter by status: 'pending' | 'reserved' | 'all'
   * @param limit - Number of results (default: 50, max: 200)
   */
  async getQueueJobs(
    queue?: string,
    status: JobStatus = 'all',
    limit: number = 50
  ): Promise<ApiResponse<QueueJobsResponse>> {
    const params: Record<string, string | number> = {
      status,
      limit
    }

    if (queue) {
      params.queue = queue
    }

    const response = await apiClient.get('/queue/jobs', { params })
    return response.data
  },

  /**
   * GET /api/v1/queue/failed
   * List failed jobs
   *
   * @param limit - Number of results (default: 50, max: 200)
   */
  async getFailedJobs(limit: number = 50): Promise<ApiResponse<FailedJobsResponse>> {
    const response = await apiClient.get('/queue/failed', {
      params: { limit }
    })
    return response.data
  },

  /**
   * POST /api/v1/queue/retry/{failed_job_id}
   * Retry a specific failed job
   *
   * @param failedJobId - ID of the failed job
   */
  async retryFailedJob(failedJobId: number): Promise<ApiResponse<RetryJobResponse>> {
    const response = await apiClient.post(`/queue/retry/${failedJobId}`)
    return response.data
  },

  /**
   * POST /api/v1/queue/retry-all-failed
   * Retry ALL failed jobs
   * ⚠️ WARNING: This can generate high load if there are many failed jobs
   */
  async retryAllFailedJobs(): Promise<ApiResponse<RetryAllResponse>> {
    const response = await apiClient.post('/queue/retry-all-failed')
    return response.data
  },

  /**
   * DELETE /api/v1/queue/jobs/{job_id}
   * Delete a job from the queue (pending or reserved)
   *
   * @param jobId - ID of the job to delete
   */
  async deleteQueueJob(jobId: number): Promise<ApiResponse<DeleteJobResponse>> {
    const response = await apiClient.delete(`/queue/jobs/${jobId}`)
    return response.data
  },

  /**
   * DELETE /api/v1/queue/failed/{failed_job_id}
   * Permanently delete a failed job (without retry)
   *
   * @param failedJobId - ID of the failed job to delete
   */
  async deleteFailedJob(failedJobId: number): Promise<ApiResponse<RetryJobResponse>> {
    const response = await apiClient.delete(`/queue/failed/${failedJobId}`)
    return response.data
  },

  /**
   * POST /api/v1/queue/clear-failed
   * Delete ALL failed jobs permanently
   * ⚠️ WARNING: This action cannot be undone
   */
  async clearAllFailedJobs(): Promise<ApiResponse<ClearFailedResponse>> {
    const response = await apiClient.post('/queue/clear-failed')
    return response.data
  }
}
