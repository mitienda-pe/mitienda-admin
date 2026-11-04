import { defineStore } from 'pinia'
import { ref } from 'vue'
import { benefitsApi } from '@/api/benefits.api'
import type { Benefit, BenefitClickAction, BenefitClickSource, BenefitSlot } from '@/types/benefit.types'

/**
 * Beneficios de la plataforma (partners y apps propias). Se piden una vez por
 * tienda; la API ya quita los de apps que la tienda usa.
 */
export const useBenefitsStore = defineStore('benefits', () => {
  const items = ref<Benefit[]>([])
  const isLoaded = ref(false)
  const loadedForStore = ref<number | null>(null)
  /** Lo que muestra el menú lateral ahora: los espacios de pantalla lo evitan. */
  const sidebarBenefitId = ref<number | null>(null)

  let inFlight: Promise<void> | null = null

  async function ensureLoaded(storeId: number | null) {
    if (!storeId) return
    if (isLoaded.value && loadedForStore.value === storeId) return
    if (inFlight) return inFlight

    inFlight = (async () => {
      try {
        items.value = await benefitsApi.list()
      } catch {
        // Son tarjetas opcionales: si falla, simplemente no se muestran.
        items.value = []
      } finally {
        isLoaded.value = true
        loadedForStore.value = storeId
        inFlight = null
      }
    })()
    return inFlight
  }

  /**
   * Elige uno para el espacio, al azar según el peso. `excludeId` evita
   * repetir lo que ya se ve en el menú, salvo que no haya otro.
   */
  function pick(slot: BenefitSlot, excludeId: number | null = null): Benefit | null {
    const all = items.value.filter((b) => b.slots.includes(slot))
    const candidates = all.length > 1 && excludeId !== null ? all.filter((b) => b.id !== excludeId) : all
    if (!candidates.length) return null

    const total = candidates.reduce((sum, b) => sum + Math.max(1, b.weight), 0)
    let roll = Math.random() * total
    for (const b of candidates) {
      roll -= Math.max(1, b.weight)
      if (roll < 0) return b
    }
    return candidates[candidates.length - 1]
  }

  /** Se manda sin esperar: una métrica nunca debe frenar al usuario. */
  function trackClick(id: number, slot: BenefitClickSource, action: BenefitClickAction) {
    benefitsApi.click(id, slot, action).catch(() => {})
  }

  return { items, isLoaded, sidebarBenefitId, ensureLoaded, pick, trackClick }
})
