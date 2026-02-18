/**
 * IDs de botón para el LLM Proxy (auto-generados por el backend).
 * Cada botón trackea consumo de tokens por tenant, usuario (tienda) y caso de uso.
 *
 * Para agregar un nuevo botón:
 * 1. Crear el botón en el admin del LLM Proxy
 * 2. Copiar el button_id generado (formato: btn-XXXXXXXX-XXXXXXXX)
 * 3. Actualizar el valor aquí
 */

/** Fallback para dev local */
const DEFAULT_BUTTON_ID = 'btn-69962669-e3fc2337' // BTN-DEV-001

export const AI_BUTTON_IDS = {
  product: {
    description: 'BTN00001', // mitienda descripción de productos
    shortDescription: 'btn-69962583-a78d9c1c', // BTN-PROD-SHORT-DESC
    metaTitle: 'btn-69962cc9-2c2ee207', // BTN-PROD-META-TITLE
    metaDescription: 'btn-69962cdc-395e118a', // BTN-PROD-META-DESC
  },
  legal: {
    terminos: 'btn-69962d1e-aed622c0', // BTN-LEGAL-TERMINOS
    privacidad: 'btn-69962d35-759a37d5', // BTN-LEGAL-PRIVACIDAD
    devoluciones: 'btn-69962d49-de7b6586', // BTN-LEGAL-DEVOLUCIONES
    cookies: 'btn-69962d59-0a5e3199', // BTN-LEGAL-COOKIES
    pagos: 'btn-69962d74-0eca3548', // BTN-LEGAL-PAGOS
    envios: 'btn-69962d94-4300f762', // BTN-LEGAL-ENVIOS
    promociones: 'btn-69962db2-3a447427', // BTN-LEGAL-PROMOCIONES
  },
} as const

/** Lookup para obtener el buttonId de una página legal por su slug */
export function getLegalButtonId(slug: string): string {
  return (AI_BUTTON_IDS.legal as Record<string, string>)[slug] || DEFAULT_BUTTON_ID
}
