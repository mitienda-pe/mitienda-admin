<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">{{ title }}</h3>
    <div v-if="!items?.length" class="text-sm text-gray-400 py-4 text-center">{{ emptyText }}</div>
    <ul v-else class="space-y-2.5 max-h-72 overflow-y-auto">
      <li v-for="(item, idx) in items.slice(0, 10)" :key="idx">
        <div class="flex items-center justify-between mb-0.5">
          <span class="text-sm text-gray-700 truncate flex-1 mr-3">{{ displayLabel(item.x) }}</span>
          <span class="text-sm font-medium text-gray-900 shrink-0">{{ item.y.toLocaleString('es-PE') }}</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-1.5">
          <div
            class="bg-primary rounded-full h-1.5 transition-all"
            :style="{ width: (item.y / maxValue * 100) + '%' }"
          ></div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MetricItem } from '@/api/web-analytics.api'

const props = withDefaults(defineProps<{
  title: string
  items: MetricItem[]
  formatLabel?: (label: string) => string
  emptyText?: string
}>(), {
  emptyText: 'Sin datos',
  items: () => []
})

const maxValue = computed(() => {
  if (!props.items?.length) return 1
  return Math.max(...props.items.map(i => i.y || 0), 1)
})

function displayLabel(raw: string): string {
  if (!raw) return '(directo)'
  return props.formatLabel ? props.formatLabel(raw) : raw
}
</script>
