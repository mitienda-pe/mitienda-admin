/**
 * Canal de soporte humano de la plataforma (WhatsApp).
 *
 * Desde que se retiró el chat de Tawk.to, el botón de ayuda del panel
 * (HelpFab/HelpDrawer) solo existe dentro de DashboardLayout. Las pantallas
 * previas al ingreso (login, recuperar contraseña, selección de tienda,
 * enlace mágico) usan este número para que quien no puede entrar tenga
 * a quién escribir.
 */
export const SUPPORT_WHATSAPP_NUMBER = '51967797232'

export const SUPPORT_WHATSAPP_DEFAULT_MESSAGE = 'Hola Renato, necesito ayuda con MiTienda'

export function buildSupportWhatsAppUrl(message: string = SUPPORT_WHATSAPP_DEFAULT_MESSAGE): string {
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
