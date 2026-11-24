<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from 'primevue/card'
import AppBadge from '@/components/ui/AppBadge.vue'
import {
  productPromotionsApi,
  type ProductPromotionMatch,
  type ProductPromotionsResult,
  type ProductPromotionState,
} from '@/api/promotion-v2.api'
import { useFormatters } from '@/composables/useFormatters'

/**
 * En qué promociones avanzadas está el producto y cuál le gana hoy.
 *
 * Nació de un caso real: una promo "50%" olvidada (vigente hasta 2030) le
 * ganaba a la promo nueva de 40% y nadie sabía de dónde salía el 50%. La
 * regla es la del checkout: si dos promos tocan el mismo producto se aplica
 * la que más descuenta, no se suman.
 *
 * Se oculta si el producto no está en ninguna promo.
 */
const props = defineProps<{ productId: number }>()

const { formatCurrency, formatDate } = useFormatters()

const result = ref<ProductPromotionsResult | null>(null)
const showPast = ref(false)

const PAST_STATES: ProductPromotionState[] = ['expired', 'inactive']

const current = computed(() =>
  (result.value?.promotions ?? []).filter((p) => !PAST_STATES.includes(p.state)),
)
const past = computed(() =>
  (result.value?.promotions ?? []).filter((p) => PAST_STATES.includes(p.state)),
)
const winner = computed(() => result.value?.promotions.find((p) => p.wins) ?? null)
const hasAny = computed(() => (result.value?.promotions.length ?? 0) > 0)

const STATE_LABEL: Record<ProductPromotionState, string> = {
  applies: 'Vigente',
  conditional: 'Según el carrito',
  coupon: 'Con cupón',
  out_of_hours: 'Fuera de horario',
  scheduled: 'Programada',
  expired: 'Vencida',
  inactive: 'Pausada / borrador',
}

const STATE_VARIANT: Record<ProductPromotionState, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  applies: 'success',
  conditional: 'info',
  coupon: 'info',
  out_of_hours: 'warning',
  scheduled: 'neutral',
  expired: 'neutral',
  inactive: 'neutral',
}

const VIA_LABEL: Record<ProductPromotionMatch['via'], string> = {
  product: 'por producto',
  category: 'por categoría',
  brand: 'por marca',
  gift: 'se regala',
  trigger: 'activa un regalo',
  condition: 'en una condición',
}

function effectLabel(p: ProductPromotionMatch): string {
  const e = p.effect
  if (!e) return 'Activa la promoción'
  switch (e.type) {
    case 'percentage_discount_product':
    case 'percentage_discount_category':
    case 'percentage_discount_brand':
      return `${e.percentage ?? 0}% de descuento`
    case 'fixed_discount_product':
      return `${formatCurrency(e.amount ?? 0)} menos`
    case 'override_price':
      return `Precio ${formatCurrency(e.new_price ?? 0)}`
    case 'buy_x_pay_y':
      return `Lleva ${e.buy_quantity ?? 0}, paga ${e.pay_quantity ?? 0}`
    case 'gift_product':
      return p.via === 'gift' ? 'Regalo' : 'Da un regalo'
    default:
      return e.type
  }
}

function dateRange(p: ProductPromotionMatch): string {
  const from = p.starts_at ? formatDate(p.starts_at) : null
  const to = p.ends_at ? formatDate(p.ends_at) : null
  if (from && to) return `${from} – ${to}`
  if (to) return `Hasta ${to}`
  if (from) return `Desde ${from}, sin fecha de fin`
  return 'Sin fechas'
}

function detailLink(p: ProductPromotionMatch): string {
  const isCoupon = p.activation_types.includes('coupon') && !p.activation_types.includes('automatic')
  return isCoupon ? `/marketing/coupons/${p.promotion_id}` : `/marketing/promotions-v2/${p.promotion_id}`
}

async function load() {
  try {
    const response = await productPromotionsApi.getForProduct(props.productId)
    result.value = response.success ? response.data ?? null : null
  } catch {
    // Informativa: si falla, la ficha sigue funcionando sin la tarjeta.
    result.value = null
  }
}

watch(() => props.productId, load, { immediate: true })
</script>

<template>
  <Card v-if="hasAny && result">
    <template #title>
      <span class="text-lg">Promociones</span>
    </template>
    <template #content>
      <div class="space-y-4">
        <div
          v-if="result.competing > 1 && winner"
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          <i class="pi pi-exclamation-triangle mr-1"></i>
          {{ result.competing }} promociones vigentes descuentan este producto a la vez. No se suman: se
          aplica la de mayor descuento, <strong>{{ winner.name }}</strong>. Si quieres que rija otra, pausa
          las demás.
        </div>

        <ul v-if="current.length" class="divide-y divide-gray-100 border rounded-lg">
          <li v-for="p in current" :key="p.promotion_id" class="px-3 py-2 text-sm space-y-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <router-link :to="detailLink(p)" class="font-medium text-primary hover:underline break-all">
                {{ p.name || `Promoción #${p.promotion_id}` }}
              </router-link>
              <div class="flex items-center gap-1">
                <AppBadge v-if="p.wins" label="Se aplica" variant="success" size="small" icon="pi pi-check" />
                <AppBadge v-else :label="STATE_LABEL[p.state]" :variant="STATE_VARIANT[p.state]" size="small" />
              </div>
            </div>
            <p class="text-secondary-600">
              {{ effectLabel(p) }} <span class="text-secondary-400">· {{ VIA_LABEL[p.via] }}</span>
            </p>
            <p class="text-xs text-secondary-400">
              #{{ p.promotion_id }} · {{ dateRange(p) }}
              <template v-if="p.state === 'applies' && !p.wins && p.unit_discount > 0"> · le gana otra</template>
            </p>
          </li>
        </ul>
        <p v-else class="text-sm text-secondary-500">No hay promociones vigentes para este producto.</p>

        <div v-if="past.length">
          <button type="button" class="text-sm text-primary hover:underline" @click="showPast = !showPast">
            {{ showPast ? 'Ocultar' : 'Ver' }} vencidas y pausadas ({{ past.length }})
          </button>
          <ul v-if="showPast" class="mt-2 divide-y divide-gray-100 border rounded-lg">
            <li v-for="p in past" :key="p.promotion_id" class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
              <router-link :to="detailLink(p)" class="text-secondary hover:underline break-all">
                {{ p.name || `Promoción #${p.promotion_id}` }}
              </router-link>
              <span class="text-xs text-secondary-400">{{ effectLabel(p) }} · {{ STATE_LABEL[p.state] }}</span>
            </li>
          </ul>
        </div>

        <p class="text-xs text-secondary-400">
          No incluye descuentos sobre todo el carrito ni de envío, que alcanzan a todos los productos.
        </p>
      </div>
    </template>
  </Card>
</template>
