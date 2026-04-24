<script setup lang="ts">
import { computed } from 'vue'

interface Entry {
  label?: string
  values?: Record<string, any>
  computed?: Record<string, number>
}

interface Props {
  pluginData?: {
    entries?: Entry[] | null
    values?: Record<string, any> | null
    summary?: string | null
  } | null
  pluginSummary?: string | null
}

const props = defineProps<Props>()

const entries = computed<Entry[]>(() => props.pluginData?.entries ?? [])
const summary = computed(() => props.pluginSummary || props.pluginData?.summary || '')

function areaFor(entry: Entry): number {
  if (typeof entry.computed?.area === 'number') return entry.computed.area
  const w = Number(entry.values?.width ?? 0)
  const h = Number(entry.values?.height ?? 0)
  return w * h
}
</script>

<template>
  <div class="mt-2 rounded bg-gray-50 p-3 text-xs">
    <p class="mb-1 font-medium text-gray-700">{{ summary }}</p>
    <table v-if="entries.length" class="w-full text-left">
      <thead>
        <tr class="text-gray-500">
          <th class="pb-1">Ventana</th>
          <th class="pb-1">Ancho (m)</th>
          <th class="pb-1">Alto (m)</th>
          <th class="pb-1">Área (m²)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, i) in entries" :key="i" class="border-t border-gray-200">
          <td class="py-1">{{ entry.label || `Ventana ${i + 1}` }}</td>
          <td class="py-1">{{ Number(entry.values?.width ?? 0).toFixed(2) }}</td>
          <td class="py-1">{{ Number(entry.values?.height ?? 0).toFixed(2) }}</td>
          <td class="py-1">{{ areaFor(entry).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
