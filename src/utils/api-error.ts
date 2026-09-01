/**
 * Extrae el mensaje de error de una respuesta de la API.
 *
 * CI4 devuelve las fallas de validación en `messages` como un objeto
 * campo → mensaje, así que leer solo `messages.error` (o `message`, que ni
 * existe) deja al usuario con un "Request failed with status code 400" y sin
 * saber qué campo rechazó el backend.
 */
export function apiErrorMessage(error: any, fallback: string): string {
  const data = error?.response?.data

  if (data?.messages && typeof data.messages === 'object') {
    const parts = Object.values(data.messages).filter(
      (value): value is string => typeof value === 'string' && value.trim() !== ''
    )
    if (parts.length > 0) return parts.join(' ')
  }

  if (typeof data?.messages === 'string' && data.messages.trim() !== '') return data.messages
  if (typeof data?.message === 'string' && data.message.trim() !== '') return data.message

  return fallback
}
