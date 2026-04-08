import apiClient from './axios'

export interface AnalyticsStats {
  pageviews: { value: number; prev: number }
  visitors: { value: number; prev: number }
  visits: { value: number; prev: number }
  bounces: { value: number; prev: number }
  totaltime: { value: number; prev: number }
}

export interface PageviewsData {
  pageviews: Array<{ x: string; y: number }>
  sessions: Array<{ x: string; y: number }>
}

export interface MetricItem {
  x: string
  y: number
}

export interface FunnelStep {
  step: string
  count: number
  rate: number
}

export const webAnalyticsApi = {
  async getStats(startAt: number, endAt: number) {
    const res = await apiClient.get(`/web-analytics/stats?start_at=${startAt}&end_at=${endAt}`)
    return res.data
  },

  async getPageviews(startAt: number, endAt: number, unit: string = 'day') {
    const res = await apiClient.get(`/web-analytics/pageviews?start_at=${startAt}&end_at=${endAt}&unit=${unit}`)
    return res.data
  },

  async getMetrics(startAt: number, endAt: number, type: string) {
    const res = await apiClient.get(`/web-analytics/metrics?start_at=${startAt}&end_at=${endAt}&type=${type}`)
    return res.data
  },

  async getActive() {
    const res = await apiClient.get('/web-analytics/active')
    return res.data
  },

  async getFunnel(startAt: number, endAt: number) {
    const res = await apiClient.get(`/web-analytics/funnel?start_at=${startAt}&end_at=${endAt}`)
    return res.data
  }
}
