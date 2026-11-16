import { ref } from 'vue'
import { dispatchApi } from '@/api/dispatch.api'
import type { Order } from '@/types/order.types'

/**
 * Cierre de pedidos de solo servicios ("Servicio atendido").
 *
 * Un servicio no se despacha: no se prepara, no sale en camino ni espera
 * retiro. El cierre reusa el estado 34 del despacho (el mismo de "Entregado"),
 * porque de él dependen la fecha de entrega, la solicitud de opinión y los
 * reportes. El backend lo rotula "Servicio atendido" en estos pedidos.
 */
export const STATE_SERVICIO_ATENDIDO = 34

/** Estados de cierre: atendido/entregado, rechazado, cancelado, devuelto. */
const CLOSED_STATES = [34, 35, 36, 37]

/** Pedido de servicios pagado que todavía nadie cerró. */
export function isAttendableService(order: Pick<Order, 'service_only' | 'status' | 'dispatch_state'>): boolean {
  return order.service_only === true
    && order.status === 'paid'
    && !!order.dispatch_state
    && !CLOSED_STATES.includes(order.dispatch_state.id)
}

export function useServiceAttended() {
  const isSaving = ref(false)

  /**
   * Marca los pedidos como atendidos. Devuelve cuántos se cerraron y cuántos
   * rechazó el backend (p. ej. un pedido que otro usuario ya cerró).
   */
  async function markAttended(orderIds: number[], notifyCustomer: boolean) {
    isSaving.value = true
    try {
      const response = await dispatchApi.batchUpdateStatus({
        order_ids: orderIds,
        state_id: STATE_SERVICIO_ATENDIDO,
        notify_customer: notifyCustomer,
      })
      return {
        success: response.data?.success ?? 0,
        errors: response.data?.errors ?? 0,
      }
    } finally {
      isSaving.value = false
    }
  }

  return { isSaving, markAttended }
}
