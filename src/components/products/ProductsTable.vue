<template>
  <DataTable
    v-model:selection="selection"
    :value="products"
    dataKey="id"
    :rowHover="true"
    class="bg-white rounded-lg shadow mb-6"
    @row-click="onRowClick"
  >
    <Column selectionMode="multiple" headerStyle="width: 3rem" />

    <Column header="Producto">
      <template #body="{ data }">
        <div class="flex items-center gap-3 cursor-pointer">
          <img
            :src="mainImage(data) || placeholderImage"
            :alt="data.name"
            class="w-12 h-12 rounded object-cover bg-gray-100 flex-shrink-0"
          />
          <div class="min-w-0">
            <div class="font-medium text-secondary line-clamp-2">{{ data.name }}</div>
            <div class="text-xs text-secondary-500">{{ data.sku }}</div>
          </div>
        </div>
      </template>
    </Column>

    <Column header="Marca" class="hidden md:table-cell">
      <template #body="{ data }">
        <span class="text-sm text-secondary-600">{{ data.brand?.name || '—' }}</span>
      </template>
    </Column>

    <Column header="Precio">
      <template #body="{ data }">
        <div class="whitespace-nowrap">
          <span class="font-semibold text-primary">{{ formatCurrency(data.price) }}</span>
          <span
            v-if="data.original_price && data.original_price > data.price"
            class="block text-xs text-secondary-400 line-through"
          >
            {{ formatCurrency(data.original_price) }}
          </span>
        </div>
      </template>
    </Column>

    <Column header="Stock">
      <template #body="{ data }">
        <span :class="stockClass(data)" class="text-sm whitespace-nowrap">
          {{ data.unlimited_stock ? 'Ilimitado' : data.stock }}
        </span>
      </template>
    </Column>

    <Column header="Estado">
      <template #body="{ data }">
        <Tag
          :value="data.published ? 'Publicado' : 'Oculto'"
          :severity="data.published ? 'success' : 'secondary'"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import DataTable, { type DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import type { Product } from '@/types/product.types'
import { useFormatters } from '@/composables/useFormatters'
import placeholderImage from '@/assets/images/landscape-placeholder-svgrepo-com.svg'

defineProps<{ products: Product[] }>()
const selection = defineModel<Product[]>('selection', { default: () => [] })

const router = useRouter()
const { formatCurrency } = useFormatters()

const mainImage = (p: Product) =>
  (p.images?.find(img => img.is_main) || p.images?.[0])?.url

const stockClass = (p: Product) => {
  if (p.unlimited_stock) return 'text-green-600'
  if (p.stock === 0) return 'text-red-600'
  if (p.min_stock && p.stock <= p.min_stock) return 'text-orange-600'
  return 'text-green-600'
}

// Clic en la fila abre el detalle, salvo cuando el clic fue en el checkbox.
const onRowClick = (e: DataTableRowClickEvent) => {
  const target = e.originalEvent.target as HTMLElement | null
  if (target?.closest('.p-checkbox, .p-selection-column')) return
  router.push(`/products/${(e.data as Product).id}`)
}
</script>
