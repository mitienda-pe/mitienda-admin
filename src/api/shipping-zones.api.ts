import api from './axios'
import type {
  ShippingZone,
  ShippingZoneDetail,
  UbigeoOption,
  CreateShippingZoneRequest,
  AddUbigeoRequest,
} from '@/types/shipping-zone.types'

export const shippingZonesApi = {
  async getAll(): Promise<ShippingZone[]> {
    const { data } = await api.get('/shipping-zones')
    return data.data
  },

  async getById(id: number): Promise<ShippingZoneDetail> {
    const { data } = await api.get(`/shipping-zones/${id}`)
    return data.data
  },

  async create(payload: CreateShippingZoneRequest): Promise<{ id: number }> {
    const { data } = await api.post('/shipping-zones', payload)
    return data.data
  },

  async update(id: number, name: string): Promise<void> {
    await api.put(`/shipping-zones/${id}`, { name })
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/shipping-zones/${id}`)
  },

  async addUbigeo(zoneId: number, payload: AddUbigeoRequest): Promise<void> {
    await api.post(`/shipping-zones/${zoneId}/ubigeos`, payload)
  },

  async removeUbigeo(zoneId: number, ubigeoId: number): Promise<void> {
    await api.delete(`/shipping-zones/${zoneId}/ubigeos/${ubigeoId}`)
  },

  // Ubigeo navigation
  async getCountries(): Promise<UbigeoOption[]> {
    const { data } = await api.get('/ubigeo/countries')
    return data.data
  },

  async getRegions(codPais: number): Promise<UbigeoOption[]> {
    const { data } = await api.get('/ubigeo/regions', { params: { codPais } })
    return data.data
  },

  async getProvinces(codPais: number, codDpto: number): Promise<UbigeoOption[]> {
    const { data } = await api.get('/ubigeo/provinces', { params: { codPais, codDpto } })
    return data.data
  },

  async getDistricts(codPais: number, codDpto: number, codProv: number): Promise<UbigeoOption[]> {
    const { data } = await api.get('/ubigeo/districts', { params: { codPais, codDpto, codProv } })
    return data.data
  },
}
