<template>
  <div>
    <DataTable
      :value="variants"
      :loading="loading"
      stripedRows
      class="p-datatable-sm"
      editMode="cell"
      responsiveLayout="scroll"
    >
      <!-- Variant Name (read-only) -->
      <Column header="Variante" style="min-width: 180px">
        <template #body="{ data }">
          <span class="font-medium text-secondary-700">{{ data.names }}</span>
        </template>
      </Column>

      <!-- SKU -->
      <Column header="SKU" style="min-width: 150px">
        <template #body="{ data }">
          <InputText
            v-model="data.sku"
            class="w-full p-inputtext-sm"
            placeholder="SKU"
            @change="emitUpdate"
          />
        </template>
      </Column>

      <!-- Price -->
      <Column header="Precio" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.price"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            prefix="S/ "
            class="w-full p-inputtext-sm"
            @input="emitUpdate"
          />
        </template>
      </Column>

      <!-- Offer Price -->
      <Column header="P. Oferta" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.offer_price"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            prefix="S/ "
            class="w-full p-inputtext-sm"
            placeholder="Opcional"
            @input="emitUpdate"
          />
        </template>
      </Column>

      <!-- Stock -->
      <Column header="Stock" style="min-width: 100px">
        <template #body="{ data }">
          <InputNumber
            v-if="!data.unlimited_stock"
            v-model="data.stock"
            :min="0"
            class="w-full p-inputtext-sm"
            @input="emitUpdate"
          />
          <span v-else class="text-sm text-secondary-400 italic">Ilimitado</span>
        </template>
      </Column>

      <!-- Unlimited Stock -->
      <Column header="Ilimitado" style="width: 90px" class="text-center">
        <template #body="{ data }">
          <Checkbox
            v-model="data.unlimited_stock"
            :binary="true"
            @change="emitUpdate"
          />
        </template>
      </Column>

      <!-- Delete -->
      <Column style="width: 60px">
        <template #body="{ index }">
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="removeVariant(index)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Summary -->
    <div v-if="variants.length > 0" class="flex items-center justify-between mt-3 text-sm text-secondary-500">
      <span>{{ variants.length }} variantes</span>
      <span v-if="priceRange">
        Rango: S/ {{ priceRange.min.toFixed(2) }} - S/ {{ priceRange.max.toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProductVariant } from '@/types/product.types'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'

const props = defineProps<{
  variants: ProductVariant[]
  loading?: boolean
}>()

const emit = defineEmits<{
  update: []
  remove: [index: number]
}>()

const priceRange = computed(() => {
  if (!props.variants.length) return null
  const prices = props.variants.map(v => v.price).filter(p => p > 0)
  if (!prices.length) return null
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
})

function emitUpdate() {
  emit('update')
}

function removeVariant(index: number) {
  emit('remove', index)
}
</script>
