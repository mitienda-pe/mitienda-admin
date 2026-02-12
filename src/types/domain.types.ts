export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
}

export interface DnsInstructions {
  type: 'a_record' | 'cname'
  records: DnsRecord[]
  note?: string
  optional_records?: DnsRecord[]
}

export interface DnsVerification {
  dns_configured: boolean
  records_found: { type: string; value: string }[]
  expected_records: { type: string; value: string }[]
  tienda_dominio_verificado: number
}

export interface StoreDomainSettings {
  tienda_dominio: string | null
  tienda_dominio_verificado: number
  tienda_ssl: number
  tienda_nombreurl: string
  domain_type: 'root' | 'subdomain' | null
  default_url: string
  dns_instructions: DnsInstructions | null
}
