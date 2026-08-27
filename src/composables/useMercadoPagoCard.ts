import { ref } from 'vue'
import type { CardholderInput } from '@/types/billing-subscription.types'

/**
 * Tokenización de tarjeta con el SDK v2 de MercadoPago (Secure Fields).
 *
 * Los campos sensibles (número, vencimiento, CVV) viven dentro de iframes que
 * sirve MercadoPago: el dato nunca entra al DOM del backoffice ni viaja a
 * nuestra API. Lo único que sale de acá es un token de un solo uso, que el
 * backend cambia por una tarjeta guardada.
 */

const SDK_URL = 'https://sdk.mercadopago.com/js/v2'
const SDK_SCRIPT_ID = 'mercadopago-sdk-v2'

interface SecureField {
  mount: (elementId: string) => SecureField
  unmount: () => void
}

interface IdentificationType {
  id: string
  name: string
}

interface MercadoPagoInstance {
  fields: {
    create: (type: string, options?: Record<string, unknown>) => SecureField
    createCardToken: (data: Record<string, string>) => Promise<{ id: string }>
  }
  getIdentificationTypes: () => Promise<IdentificationType[]>
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance
  }
}

function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve()

  const existing = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de MercadoPago')))
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SDK_SCRIPT_ID
    script.src = SDK_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de MercadoPago'))
    document.head.appendChild(script)
  })
}

/**
 * Traduce los errores del SDK, que llegan como lista de causas con códigos.
 */
function describeTokenError(error: unknown): string {
  const causes = (error as { cause?: Array<{ code?: string; description?: string }> })?.cause
  if (!Array.isArray(causes) || causes.length === 0) {
    return error instanceof Error ? error.message : 'No se pudo validar la tarjeta'
  }

  const messages: Record<string, string> = {
    '205': 'Ingresa el número de tarjeta',
    '208': 'Ingresa el mes de vencimiento',
    '209': 'Ingresa el año de vencimiento',
    '212': 'Ingresa el tipo de documento',
    '214': 'Ingresa el número de documento',
    '221': 'Ingresa el nombre del titular',
    '224': 'Ingresa el código de seguridad',
    'E301': 'El número de tarjeta no es válido',
    'E302': 'El código de seguridad no es válido',
    '316': 'El nombre del titular no es válido',
    '325': 'El mes de vencimiento no es válido',
    '326': 'El año de vencimiento no es válido'
  }

  return causes
    .map(c => messages[c.code ?? ''] ?? c.description ?? 'Revisa los datos de la tarjeta')
    .join('. ')
}

export function useMercadoPagoCard() {
  const isReady = ref(false)
  const identificationTypes = ref<IdentificationType[]>([])

  let mp: MercadoPagoInstance | null = null
  let fields: SecureField[] = []

  /**
   * Carga el SDK y monta los tres campos seguros en los contenedores dados.
   */
  async function mount(publicKey: string, locale: string, mounts: {
    cardNumber: string
    expirationDate: string
    securityCode: string
  }): Promise<void> {
    await loadSdk()

    if (!window.MercadoPago) {
      throw new Error('No se pudo cargar el SDK de MercadoPago')
    }

    mp = new window.MercadoPago(publicKey, { locale })

    unmount()

    fields = [
      mp.fields.create('cardNumber', { placeholder: '0000 0000 0000 0000' }).mount(mounts.cardNumber),
      mp.fields.create('expirationDate', { placeholder: 'MM/AA' }).mount(mounts.expirationDate),
      mp.fields.create('securityCode', { placeholder: 'CVV' }).mount(mounts.securityCode)
    ]

    try {
      identificationTypes.value = await mp.getIdentificationTypes()
    } catch {
      // Si MP no responde el catálogo, se usa el fallback local: el tipo de
      // documento no vale la pena como bloqueo para guardar la tarjeta.
      identificationTypes.value = [
        { id: 'DNI', name: 'DNI' },
        { id: 'CE', name: 'Carné de extranjería' },
        { id: 'RUC', name: 'RUC' }
      ]
    }

    isReady.value = true
  }

  /**
   * @returns token de un solo uso para POST /billing/payment-methods
   */
  async function createToken(input: CardholderInput): Promise<string> {
    if (!mp) {
      throw new Error('El formulario de tarjeta no está listo')
    }

    try {
      const token = await mp.fields.createCardToken({
        cardholderName: input.cardholderName,
        identificationType: input.identificationType,
        identificationNumber: input.identificationNumber
      })

      if (!token?.id) {
        throw new Error('MercadoPago no devolvió un token de tarjeta')
      }

      return token.id
    } catch (error) {
      throw new Error(describeTokenError(error))
    }
  }

  function unmount(): void {
    fields.forEach(field => {
      try {
        field.unmount()
      } catch {
        // El campo ya no está en el DOM; nada que limpiar.
      }
    })
    fields = []
    isReady.value = false
  }

  return { isReady, identificationTypes, mount, createToken, unmount }
}
