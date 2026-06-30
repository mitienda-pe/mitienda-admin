import api from './axios'
import type {
  BranchZoneAssignment,
  BranchZoneOptions,
  CreateBranchZoneRequest,
  UpdateBranchZoneRequest,
} from '@/types/branch-zone.types'

export const branchZonesApi = {
  async getAll(): Promise<BranchZoneAssignment[]> {
    const { data } = await api.get('/branch-zones')
    return data.data
  },

  async getOptions(): Promise<BranchZoneOptions> {
    const { data } = await api.get('/branch-zones/options')
    return data.data
  },

  async create(payload: CreateBranchZoneRequest): Promise<{ id: number }> {
    const { data } = await api.post('/branch-zones', payload)
    return data.data
  },

  async update(id: number, payload: UpdateBranchZoneRequest): Promise<void> {
    await api.put(`/branch-zones/${id}`, payload)
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/branch-zones/${id}`)
  },
}
