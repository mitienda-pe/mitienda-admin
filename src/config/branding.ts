import logoMitienda from '@/assets/images/logo-mitienda.svg'
import logoTiendabox from '@/assets/images/logo-tiendabox.svg'

export type Country = 'pe' | 'co' | 'ec'

interface BrandConfig {
  country: Country
  logo: string
  name: string
  title: string
  domain: string
}

const brandsByDomain: Record<string, BrandConfig> = {
  'admin.mitienda.pe': {
    country: 'pe',
    logo: logoMitienda,
    name: 'MiTienda',
    title: 'MiTienda - Backoffice',
    domain: 'admin.mitienda.pe',
  },
  'admin.tiendabox.co': {
    country: 'co',
    logo: logoTiendabox,
    name: 'TiendaBox',
    title: 'TiendaBox - Backoffice',
    domain: 'admin.tiendabox.co',
  },
  'admin.tiendabox.ec': {
    country: 'ec',
    logo: logoTiendabox,
    name: 'TiendaBox',
    title: 'TiendaBox - Backoffice',
    domain: 'admin.tiendabox.ec',
  },
}

// Default to MiTienda (Peru) for localhost and unknown domains
const defaultBrand: BrandConfig = brandsByDomain['admin.mitienda.pe']

export function getBrand(): BrandConfig {
  const hostname = window.location.hostname
  return brandsByDomain[hostname] ?? defaultBrand
}

export const brand = getBrand()
