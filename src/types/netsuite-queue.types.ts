/**
 * Types for NetSuite Queue Management
 * Based on API documentation: docs/QUEUE_MANAGEMENT_API.md
 */

export interface QueueJob {
  id: number
  queue: string
  attempts: number
  max_attempts: number
  job_class: string
  order_id?: number
  tienda_id: number
  created_at_human: string
  available_at_human: string
  reserved_at_human: string | null
  age_seconds: number
  payload?: Record<string, any>
}

export interface FailedJob {
  id: number
  queue: string
  job_class: string
  order_id?: number
  tienda_id: number
  exception_short: string
  exception?: string
  failed_at: string
  payload?: Record<string, any>
}

export interface QueueStats {
  pending_jobs: Array<{ queue: string; count: string | number }>
  reserved_jobs: Array<{ queue: string; count: string | number }>
  failed_jobs_count: string | number
  oldest_pending_age_seconds: number | null
  oldest_pending_job: {
    queue: string
    created_at: string | number
    available_at: string | number
  } | null
  timestamp: string
}

export interface QueueJobsResponse {
  jobs: QueueJob[]
  count: number
  filters: {
    queue?: string
    status?: JobStatus
    limit: number
  }
}

export interface FailedJobsResponse {
  failed_jobs: FailedJob[]
  count: number
}

export interface RetryJobResponse {
  queue: string
  failed_at: string
}

export interface RetryAllResponse {
  retried_count: number
}

export interface DeleteJobResponse {
  queue: string
  attempts: number
}

export interface ClearFailedResponse {
  deleted_count: number
}

export type JobStatus = 'pending' | 'reserved' | 'all'

export interface QueueFilters {
  queue?: string
  status: JobStatus
  limit: number
}
