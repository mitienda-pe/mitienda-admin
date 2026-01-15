// Payment Gateway Types

export type GatewayEnvironment = 'produccion' | 'prueba' | 'integracion'

export interface PaymentGateway {
  id: number
  code: string
  name: string
  logo: string
  description: string
  configured: boolean
  enabled: boolean
  environment?: GatewayEnvironment
}

export interface GatewayConfig {
  gateway: PaymentGateway
  credentials: GatewayCredentials | null
}

export interface GatewayCredentials {
  gateway_id: number
  credentials: Record<string, string | boolean | number | null>
  environment: GatewayEnvironment
  enabled: boolean
}

// Izipay
export interface IzipayCredentials {
  api_key: string
  merchant_code: string
  secret: string
  environment: GatewayEnvironment
  payment_methods: IzipayPaymentMethods
}

export interface IzipayPaymentMethods {
  card: boolean
  yape: boolean
  banca_movil: boolean
  agente: boolean
  billetera: boolean
  cuotealo: boolean
}

// Niubiz
export interface NiubizCredentials {
  merchant_id: string
  cybersource_code: string
  environment: GatewayEnvironment
}

// Culqi
export interface CulqiCredentials {
  public_key: string
  private_key: string
  app_id?: string
  environment: GatewayEnvironment
  payment_methods: CulqiPaymentMethods
}

export interface CulqiPaymentMethods {
  card: boolean
  yape: boolean
  banca_movil: boolean
  agente: boolean
  billetera: boolean
}

// Mercado Pago
export interface MercadoPagoCredentials {
  access_token: string
  enable_financing: boolean
  environment: GatewayEnvironment
}

// Openpay
export interface OpenpayCredentials {
  api_key: string
  merchant_id: string
  enable_installments: boolean
  environment: GatewayEnvironment
  webhook_url?: string
}

// Powerpay
export interface PowerpayCredentials {
  client_id: string
  public_key: string
  environment: GatewayEnvironment
}

// Paypal
export interface PaypalCredentials {
  merchant_email: string
  environment: GatewayEnvironment
}

// Billeteras QR (Yape + Plin unificado)
export interface QrWalletsCredentials {
  yape_enabled: boolean
  yape_business_id?: string
  yape_qr_url?: string
  plin_enabled: boolean
  plin_business_id?: string
  plin_qr_url?: string
  instructions?: string
}

// Transferencia Bancaria
export interface BankTransferCredentials {
  holder_name: string
  document_type: string
  document_number: string
  bank: string
  account_type: string
  account_number: string
  cci?: string
  instructions?: string
}

// Contra Entrega
export interface CashOnDeliveryCredentials {
  instructions: string
  optional_text?: string
}

// Request/Response types
export interface SaveGatewayCredentialsRequest {
  credentials: Record<string, unknown>
  environment?: GatewayEnvironment
  enabled?: boolean
}

export interface TestConnectionResponse {
  connected: boolean
  environment: GatewayEnvironment
  message?: string
}

// Catálogo de pasarelas disponibles
export const GATEWAY_CATALOG: Omit<PaymentGateway, 'configured' | 'enabled'>[] = [
  {
    id: 1,
    code: 'izipay',
    name: 'Izipay',
    logo: 'izipay.png',
    description: 'Pasarela de pagos con múltiples métodos: tarjeta, Yape, Banca Móvil y más.'
  },
  {
    id: 2,
    code: 'niubiz',
    name: 'Niubiz',
    logo: 'niubiz.png',
    description: 'Solución de pagos del BBVA para comercios en Perú.'
  },
  {
    id: 3,
    code: 'culqi',
    name: 'Culqi',
    logo: 'culqi.png',
    description: 'Plataforma de pagos online con soporte para múltiples métodos.'
  },
  {
    id: 4,
    code: 'mercadopago',
    name: 'Mercado Pago',
    logo: 'mercadopago.png',
    description: 'Solución de pagos de Mercado Libre con financiamiento.'
  },
  {
    id: 5,
    code: 'openpay',
    name: 'Openpay',
    logo: 'openpay.png',
    description: 'Pasarela de pagos con soporte para cuotas.'
  },
  {
    id: 6,
    code: 'powerpay',
    name: 'Powerpay',
    logo: 'powerpay.png',
    description: 'Solución de pagos Buy Now Pay Later (BNPL).'
  },
  {
    id: 7,
    code: 'paypal',
    name: 'PayPal',
    logo: 'paypal.png',
    description: 'Pagos internacionales con PayPal.'
  },
  {
    id: 8,
    code: 'qr-wallets',
    name: 'Billeteras QR',
    logo: 'qr-wallets.png',
    description: 'Yape y Plin - Pagos con código QR.'
  },
  {
    id: 9,
    code: 'bank-transfer',
    name: 'Transferencia Bancaria',
    logo: 'bank-transfer.png',
    description: 'Depósito o transferencia a cuenta bancaria.'
  },
  {
    id: 10,
    code: 'cash-on-delivery',
    name: 'Contra Entrega',
    logo: 'cash-on-delivery.png',
    description: 'Pago en efectivo al momento de la entrega.'
  }
]
