<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Top 10 Clientes</h3>
    <div v-if="data.length === 0" class="flex items-center justify-center h-40 text-secondary-400">
      Sin datos de clientes
    </div>
    <DataTable v-else :value="data" :rows="10" class="p-datatable-sm" striped-rows>
      <Column header="Cliente" style="min-width: 180px">
        <template #body="{ data: row }">
          <span class="font-medium text-secondary">{{ row.name }}</span>
        </template>
      </Column>
      <Column field="orders_count" header="Pedidos" style="width: 90px" class="text-right">
        <template #body="{ data: row }">
          <span class="font-medium">{{ row.orders_count }}</span>
        </template>
      </Column>
      <Column header="Total Neto" style="width: 130px" class="text-right">
        <template #body="{ data: row }">
          <span class="font-medium">{{ formatCurrency(row.net_total) }}</span>
        </template>
      </Column>
      <Column header="Ticket Prom." style="width: 120px" class="text-right">
        <template #body="{ data: row }">
          <span class="text-secondary-600">{{ formatCurrency(row.avg_ticket) }}</span>
        </template>
      </Column>
      <Column header="Última Compra" style="width: 120px">
        <template #body="{ data: row }">
          <span class="text-secondary-500 text-sm">{{ formatShortDate(row.last_order) }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useFormatters } from '@/composables/useFormatters'
import type { TopCustomer } from '@/types/dashboard.types'

interface Props {
  data: TopCustomer[]
}

defineProps<Props>()
const { formatCurrency } = useFormatters()

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
