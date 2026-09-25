<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/useFormatters'

/**
 * Helado / cremolada armado con el plugin `flavor-builder` en el detalle del
 * pedido: sabores y toppings congelados en la orden. Las líneas del armador
 * legacy llegan con `legacy: true` (el API adapta su JSON) y solo traen nombres.
 */
interface Props {
  pluginData?: {
    legacy?: boolean
    values?: {
      snapshot?: {
        flavors?: { label: string }[]
        toppings?: { label: string; price?: number | null }[]
      }
    } | null
    summary?: string | null
  } | null
  pluginSummary?: string | null
}

const props = defineProps<Props>()

const flavors = computed(() => props.pluginData?.values?.snapshot?.flavors ?? [])
const toppings = computed(() => props.pluginData?.values?.snapshot?.toppings ?? [])
const summary = computed(() => props.pluginSummary || props.pluginData?.summary || '')

const { formatCurrency } = useFormatters()
</script>

<template>
  <div class="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
    <template v-if="flavors.length || toppings.length">
      <div v-if="flavors.length" class="flex flex-wrap items-center gap-1.5">
        <span class="text-gray-500">Sabores:</span>
        <span
          v-for="(f, i) in flavors"
          :key="`f${i}`"
          class="rounded-full bg-white px-2 py-0.5 font-medium text-gray-900 ring-1 ring-gray-200"
        >{{ f.label }}</span>
      </div>
      <div v-if="toppings.length" class="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span class="text-gray-500">Toppings:</span>
        <span
          v-for="(t, i) in toppings"
          :key="`t${i}`"
          class="rounded-full bg-white px-2 py-0.5 text-gray-900 ring-1 ring-gray-200"
        >{{ t.label }}<template v-if="t.price"> (+{{ formatCurrency(t.price) }})</template></span>
      </div>
    </template>
    <p v-else class="text-gray-700">{{ summary }}</p>
    <p v-if="pluginData?.legacy" class="mt-1 text-gray-400">Pedido del armador anterior.</p>
  </div>
</template>
