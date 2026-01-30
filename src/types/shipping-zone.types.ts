export interface ShippingZone {
  id: number
  name: string
  level: 1 | 2 | 3 | 4
  levelLabel: string
  ubigeoCount: number
  createdAt: string
}

export interface ShippingZoneDetail extends ShippingZone {
  referenceUbigeoId: number | null
  ubigeos: ZoneUbigeo[]
}

export interface ZoneUbigeo {
  ubigeoId: number
  name: string
  codPais: number
  codDpto: number
  codProv: number
  codDist: number
}

export interface UbigeoOption {
  id: number
  name: string
  codPais: number
  codDpto?: number
  codProv?: number
  codDist?: number
}

export interface CreateShippingZoneRequest {
  name: string
  level: 1 | 2 | 3 | 4
  referenceUbigeoId: number | null
  ubigeos: {
    ubigeo_id: number
    codPais: number
    codDpto: number
    codProv: number
    codDist: number
  }[]
}

export interface AddUbigeoRequest {
  ubigeo_id: number
  codPais: number
  codDpto: number
  codProv: number
  codDist: number
}
