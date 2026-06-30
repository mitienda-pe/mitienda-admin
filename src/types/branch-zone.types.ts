// Zonas de reparto por sucursal (experiencia omnicanal).
// Liga cada zona de envío a una sucursal despachadora con prioridad.

export interface BranchZoneAssignment {
  id: number
  zoneId: number
  zoneName: string
  branchId: number
  branchName: string
  priority: number
  shippingCost: number | null
  shippingTime: number | null
  active: boolean
  createdAt: string
}

export interface BranchZoneOptionZone {
  id: number
  name: string
  ubigeoCount: number
}

export interface BranchZoneOptionBranch {
  id: number
  name: string
  district: string
  isPickup: boolean
}

export interface BranchZoneOptions {
  zones: BranchZoneOptionZone[]
  branches: BranchZoneOptionBranch[]
}

export interface CreateBranchZoneRequest {
  zoneId: number
  branchId: number
  priority: number
  shippingCost?: number | null
  shippingTime?: number | null
}

export interface UpdateBranchZoneRequest {
  priority?: number
  shippingCost?: number | null
  shippingTime?: number | null
  active?: boolean
}
