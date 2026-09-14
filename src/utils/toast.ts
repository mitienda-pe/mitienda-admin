import ToastEventBus from 'primevue/toasteventbus'
import type { ToastMessageOptions } from 'primevue/toast'

/**
 * Toast desde fuera del árbol de componentes.
 *
 * `useToast()` de PrimeVue solo funciona dentro de un `setup()`: se apoya en
 * `inject`. El interceptor de axios no está en ningún componente y aun así
 * necesita avisarle algo al usuario, así que emite directo al bus al que el
 * `<Toast />` de App.vue ya está suscrito — es lo mismo que hace `useToast()`
 * por dentro.
 *
 * En un componente seguí usando `useToast()`; esto es para el borde.
 */
export function notify(message: ToastMessageOptions): void {
  ToastEventBus.emit('add', { life: 4000, ...message })
}
