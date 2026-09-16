<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Card from 'primevue/card'
import { stockNotificationsApi, type StockNotificationSummary } from '@/api/stock-notifications.api'
import { useFormatters } from '@/composables/useFormatters'

/**
 * Interesados en el producto: quienes dejaron su correo en la tienda para que
 * les avisemos cuando esté disponible. El aviso sale solo (cron del API) al
 * haber stock; esta tarjeta solo muestra la demanda.
 *
 * Se oculta si nadie lo pidió nunca, para no sumar ruido a la ficha.
 */
const props = defineProps<{ productId: number }>()

const { formatDateTime } = useFormatters()

const summary = ref<StockNotificationSummary | null>(null)
const showAll = ref(false)
const VISIBLE = 5

const hasAny = computed(() => {
  const s = summary.value
  return !!s && s.pendientes + s.avisados + s.descartados > 0
})

const visibleList = computed(() => {
  const list = summary.value?.lista ?? []
  return showAll.value ? list : list.slice(0, VISIBLE)
})

async function load() {
  try {
    const response = await stockNotificationsApi.getProductSummary(props.productId)
    summary.value = response.success ? response.data ?? null : null
  } catch {
    // Informativa: si falla, la ficha sigue funcionando sin la tarjeta.
    summary.value = null
  }
}

watch(() => props.productId, load, { immediate: true })
</script>

<template>
  <Card v-if="hasAny && summary">
    <template #title>
      <span class="text-lg">Avisos de disponibilidad</span>
    </template>
    <template #content>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-6">
          <div>
            <p class="text-2xl font-bold text-primary">{{ summary.pendientes }}</p>
            <p class="text-sm text-secondary-500">esperando el aviso</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-secondary">{{ summary.avisados }}</p>
            <p class="text-sm text-secondary-500">ya avisados</p>
          </div>
        </div>

        <p class="text-sm text-secondary-500">
          Clientes que dejaron su correo en la tienda. Cuando el producto tenga stock, les llega un correo
          automáticamente.
        </p>

        <ul v-if="visibleList.length" class="divide-y divide-gray-100 border rounded-lg">
          <li
            v-for="item in visibleList"
            :key="item.email"
            class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
          >
            <span class="text-secondary break-all">{{ item.email }}</span>
            <span class="text-secondary-400 text-xs">{{ formatDateTime(item.created_at) }}</span>
          </li>
        </ul>

        <button
          v-if="summary.lista.length > VISIBLE"
          type="button"
          class="text-sm text-primary hover:underline"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Ver menos' : `Ver los ${summary.lista.length}` }}
        </button>
      </div>
    </template>
  </Card>
</template>
