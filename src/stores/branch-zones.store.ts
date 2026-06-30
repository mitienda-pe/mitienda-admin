import { ref } from 'vue'
import { defineStore } from 'pinia'
import { branchZonesApi } from '@/api/branch-zones.api'
import type {
  BranchZoneAssignment,
  BranchZoneOptions,
  CreateBranchZoneRequest,
  UpdateBranchZoneRequest,
} from '@/types/branch-zone.types'

export const useBranchZonesStore = defineStore('branch-zones', () => {
  const assignments = ref<BranchZoneAssignment[]>([])
  const options = ref<BranchZoneOptions>({ zones: [], branches: [] })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    try {
      isLoading.value = true
      error.value = null
      const [list, opts] = await Promise.all([
        branchZonesApi.getAll(),
        branchZonesApi.getOptions(),
      ])
      assignments.value = list
      options.value = opts
    } catch (err: any) {
      error.value = err.response?.data?.messages?.error || 'Error al cargar las zonas de reparto'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload: CreateBranchZoneRequest) {
    await branchZonesApi.create(payload)
    assignments.value = await branchZonesApi.getAll()
  }

  async function update(id: number, payload: UpdateBranchZoneRequest) {
    await branchZonesApi.update(id, payload)
    const idx = assignments.value.findIndex((a) => a.id === id)
    if (idx !== -1) {
      assignments.value[idx] = { ...assignments.value[idx], ...payload } as BranchZoneAssignment
    }
  }

  async function remove(id: number) {
    await branchZonesApi.remove(id)
    assignments.value = assignments.value.filter((a) => a.id !== id)
  }

  return {
    assignments,
    options,
    isLoading,
    error,
    fetchAll,
    create,
    update,
    remove,
  }
})
