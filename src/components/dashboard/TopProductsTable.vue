<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Top 10 Productos</h3>
    <div v-if="data.length === 0" class="flex items-center justify-center h-40 text-secondary-400">
      Sin datos de productos
    </div>
    <DataTable v-else :value="data" :rows="10" class="p-datatable-sm" striped-rows>
      <Column header="Producto" style="min-width: 200px">
        <template #body="{ data: row }">
          <div>
            <span class="font-medium text-secondary">{{ row.name }}</span>
            <span v-if="row.sku" class="text-xs text-secondary-400 ml-2">{{ row.sku }}</span>
          </div>
        </template>
      </Column>
      <Column field="units" header="Unidades" style="width: 100px" class="text-right">
        <template #body="{ data: row }">
          <span class="font-medium">{{ row.units }}</span>
        </template>
      </Column>
      <Column header="Ventas Netas" style="width: 130px" class="text-right">
        <template #body="{ data: row }">
          <span class="font-medium">{{ formatCurrency(row.net_sales) }}</span>
        </template>
      </Column>
      <Column header="% Part." style="width: 80px" class="text-right">
        <template #body="{ data: row }">
          <span class="text-secondary-500">{{ row.pct_of_total }}%</span>
        </template>
      </Column>
      <Column header="Stock" style="width: 80px" class="text-right">
        <template #body="{ data: row }">
          <span :class="row.stock <= 0 ? 'text-red-600 font-semibold' : 'text-secondary-600'">
            {{ row.stock }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useFormatters } from '@/composables/useFormatters'
import type { TopProduct } from '@/types/dashboard.types'

interface Props {
  data: TopProduct[]
}

defineProps<Props>()
const { formatCurrency } = useFormatters()
</script>
