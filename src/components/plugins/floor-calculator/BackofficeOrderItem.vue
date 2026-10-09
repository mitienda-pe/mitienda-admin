<script setup lang="ts">
import { computed } from 'vue'

/**
 * Línea vendida con la calculadora de pisos: los ambientes que midió el
 * cliente, la merma y cuántas cajas le recomendó la calculadora (puede haber
 * comprado otra cantidad; la cantidad real es la de la línea).
 */
interface Room { length?: number; width?: number; area?: number }

interface Props {
  pluginData?: {
    values?: {
      rooms?: Room[]
      waste?: number
      snapshot?: {
        areaBeforeWaste?: number
        totalArea?: number
        coverage?: number
        boxesNeeded?: number
        areaCovered?: number
        unit?: 'box' | 'm2'
        rollWidth?: number | null
        linearMeters?: number | null
      } | null
    } | null
    summary?: string | null
  } | null
  pluginSummary?: string | null
}

const props = defineProps<Props>()

const rooms = computed(() => props.pluginData?.values?.rooms ?? [])
const snap = computed(() => props.pluginData?.values?.snapshot ?? null)
const waste = computed(() => Number(props.pluginData?.values?.waste ?? 0))
const summary = computed(() => props.pluginSummary || props.pluginData?.summary || '')

const m2 = (n?: number) => `${Number(n ?? 0).toFixed(2)} m²`
</script>

<template>
  <div class="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
    <template v-if="rooms.length">
      <ul class="space-y-0.5">
        <li v-for="(r, i) in rooms" :key="i" class="text-gray-700">
          Ambiente {{ i + 1 }}:
          <template v-if="r.length && r.width">{{ r.length }} × {{ r.width }} m = </template>
          <span class="font-medium text-gray-900">{{ m2(r.area ?? (r.length ?? 0) * (r.width ?? 0)) }}</span>
        </li>
      </ul>
      <p v-if="snap" class="mt-1.5 text-gray-700">
        Total {{ m2(snap.areaBeforeWaste) }}<template v-if="waste > 0"> + merma {{ waste }}% = {{ m2(snap.totalArea) }}</template>
        · recomendó
        <template v-if="snap.unit === 'm2'">
          <span class="font-medium text-gray-900">{{ snap.boxesNeeded }} m²</span>
          <template v-if="snap.linearMeters"> ({{ Number(snap.linearMeters).toFixed(2) }} m lineales de rollo de {{ Number(snap.rollWidth).toFixed(2) }} m)</template>
        </template>
        <template v-else>
          <span class="font-medium text-gray-900">{{ snap.boxesNeeded }} caja(s)</span>
          de {{ m2(snap.coverage) }} ({{ m2(snap.areaCovered) }})
        </template>
      </p>
    </template>
    <p v-else class="text-gray-700">{{ summary }}</p>
  </div>
</template>
