<script setup lang="ts">
/**
 * "Quién vende": ventas pagadas por código de referido en un período.
 * Incluye los códigos sin ventas (también es información) y avisa de las
 * ventas con un código que ya no existe.
 */
import { ref, computed, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { referralApi } from '@/api/referral.api'
import { useFormatters } from '@/composables/useFormatters'
import type { ReferralSalesSummary } from '@/types/referral.types'

const { formatCurrency, formatDate } = useFormatters()

type PeriodKey = '7d' | '30d' | '90d' | 'month' | 'prev_month'
const periodOptions: { label: string; value: PeriodKey }[] = [
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Últimos 90 días', value: '90d' },
  { label: 'Este mes', value: 'month' },
  { label: 'Mes anterior', value: 'prev_month' },
]
const period = ref<PeriodKey>('30d')

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function rangeFor(key: PeriodKey): { from: string; to: string } {
  const today = new Date()
  const back = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1))
    return d
  }
  switch (key) {
    case '7d': return { from: ymd(back(7)), to: ymd(today) }
    case '90d': return { from: ymd(back(90)), to: ymd(today) }
    case 'month': return { from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), to: ymd(today) }
    case 'prev_month': return {
      from: ymd(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: ymd(new Date(today.getFullYear(), today.getMonth(), 0)),
    }
    default: return { from: ymd(back(30)), to: ymd(today) }
  }
}

const summary = ref<ReferralSalesSummary | null>(null)
const isLoading = ref(false)
const loadError = ref(false)
const showAll = ref(false)
const COLLAPSED_ROWS = 10

let seq = 0
async function load() {
  const current = ++seq
  isLoading.value = true
  loadError.value = false
  try {
    const data = await referralApi.getSalesSummary(rangeFor(period.value))
    if (current === seq) summary.value = data
  } catch {
    if (current === seq) loadError.value = true
  } finally {
    if (current === seq) isLoading.value = false
  }
}
watch(period, load, { immediate: true })
defineExpose({ reload: load })

const visibleRows = computed(() => {
  const rows = summary.value?.rows ?? []
  return showAll.value ? rows : rows.slice(0, COLLAPSED_ROWS)
})
const hiddenCount = computed(() => Math.max(0, (summary.value?.rows.length ?? 0) - COLLAPSED_ROWS))
const averageTicket = computed(() => {
  const t = summary.value?.totals
  return t && t.orders > 0 ? t.total / t.orders : 0
})
</script>

<template>
  <section class="bg-white rounded-lg shadow p-4 mb-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <div>
        <h2 class="text-lg font-semibold text-secondary">Ventas por código</h2>
        <p class="text-sm text-secondary-500">Pedidos pagados que llegaron con cada código</p>
      </div>
      <Dropdown
        v-model="period"
        :options="periodOptions"
        optionLabel="label"
        optionValue="value"
        class="w-full sm:w-56"
      />
    </div>

    <div v-if="loadError" class="text-sm text-red-600 flex items-center gap-2">
      <i class="pi pi-exclamation-circle" />
      No se pudieron cargar las ventas.
      <Button label="Reintentar" text size="small" @click="load" />
    </div>

    <template v-else-if="summary">
      <!-- Totales -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs text-secondary-500">Pedidos</p>
          <p class="text-xl font-bold text-secondary">{{ summary.totals.orders }}</p>
        </div>
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs text-secondary-500">Monto vendido</p>
          <p class="text-xl font-bold text-secondary">{{ formatCurrency(summary.totals.total) }}</p>
        </div>
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs text-secondary-500">Ticket promedio</p>
          <p class="text-xl font-bold text-secondary">{{ formatCurrency(averageTicket) }}</p>
        </div>
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs text-secondary-500">Códigos que vendieron</p>
          <p class="text-xl font-bold text-secondary">
            {{ summary.totals.codes_with_sales }}
            <span class="text-sm font-normal text-secondary-500">de {{ summary.totals.codes }}</span>
          </p>
        </div>
      </div>

      <DataTable
        v-if="summary.rows.length"
        :value="visibleRows"
        :loading="isLoading"
        dataKey="id"
        responsiveLayout="scroll"
        size="small"
      >
        <Column header="Referidor">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-semibold" :class="{ 'text-secondary-400': data.orders === 0 }">
                {{ data.name || '—' }}
              </span>
              <Tag v-if="!data.active" value="Inactivo" severity="secondary" />
            </div>
            <code class="text-xs text-secondary-500 font-mono">{{ data.code }}</code>
          </template>
        </Column>
        <Column header="Pedidos" style="width: 100px" bodyClass="text-right" headerClass="justify-end">
          <template #body="{ data }">{{ data.orders }}</template>
        </Column>
        <Column header="Monto" style="width: 140px" bodyClass="text-right font-semibold" headerClass="justify-end">
          <template #body="{ data }">{{ data.orders ? formatCurrency(data.total) : '—' }}</template>
        </Column>
        <Column header="Ticket" style="width: 120px" bodyClass="text-right" headerClass="justify-end">
          <template #body="{ data }">{{ data.orders ? formatCurrency(data.average) : '—' }}</template>
        </Column>
        <Column header="Última venta" style="width: 130px">
          <template #body="{ data }">
            <span class="text-sm text-secondary-600">{{ data.last_sale ? formatDate(data.last_sale) : '—' }}</span>
          </template>
        </Column>
      </DataTable>

      <div class="flex flex-wrap items-center justify-between gap-2 mt-3">
        <Button
          v-if="hiddenCount > 0"
          :label="showAll ? 'Ver menos' : `Ver los ${hiddenCount} restantes`"
          text
          size="small"
          @click="showAll = !showAll"
        />
        <p v-if="summary.unmatched.orders > 0" class="text-xs text-secondary-500">
          Además, {{ summary.unmatched.orders }}
          {{ summary.unmatched.orders === 1 ? 'pedido llegó' : 'pedidos llegaron' }}
          con un código que ya no existe ({{ formatCurrency(summary.unmatched.total) }}).
        </p>
      </div>
    </template>

    <div v-else-if="isLoading" class="text-sm text-secondary-500 py-6 text-center">Cargando ventas…</div>
  </section>
</template>
