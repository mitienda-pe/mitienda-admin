<template>
  <div v-if="bars.length > 0" class="flex flex-col">
    <div
      v-for="b in bars"
      :key="b.id"
      :class="['flex items-center gap-3 px-4 py-2.5 text-sm shadow-sm', barClass(b.severity)]"
    >
      <i :class="severityIcon(b.severity)" class="text-base shrink-0" />
      <div class="flex-1 min-w-0">
        <span class="font-semibold mr-2">{{ b.title }}</span>
        <span class="opacity-95">{{ b.body }}</span>
      </div>
      <a
        v-if="b.cta_label && b.cta_url"
        :href="b.cta_url"
        target="_blank"
        rel="noopener"
        class="shrink-0 rounded-md bg-white/20 px-3 py-1 text-white text-xs font-medium hover:bg-white/30 transition-colors"
      >
        {{ b.cta_label }}
      </a>
      <button
        v-if="b.is_dismissible"
        type="button"
        class="shrink-0 text-white/80 hover:text-white transition-colors"
        :aria-label="'Cerrar ' + b.title"
        @click="store.dismiss(b.id)"
      >
        <i class="pi pi-times text-sm" />
      </button>
      <i v-else class="pi pi-lock text-white/70 text-sm shrink-0" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import type { BroadcastSeverity } from '@/types/broadcast.types'

const store = useBroadcastsStore()

const bars = computed(() => {
  const rank = (s: BroadcastSeverity) =>
    s === 'danger' ? 0 : s === 'warning' ? 1 : 2
  return [...store.activeBars].sort((a, b) => {
    const byRank = rank(a.severity) - rank(b.severity)
    if (byRank !== 0) return byRank
    return (b.published_at || '').localeCompare(a.published_at || '')
  })
})

function barClass(s: BroadcastSeverity) {
  switch (s) {
    case 'danger':  return 'bg-red-600 text-white'
    case 'warning': return 'bg-amber-500 text-white'
    default:        return 'bg-primary text-white'
  }
}
function severityIcon(s: BroadcastSeverity) {
  switch (s) {
    case 'danger':  return 'pi pi-exclamation-circle'
    case 'warning': return 'pi pi-exclamation-triangle'
    default:        return 'pi pi-megaphone'
  }
}
</script>
