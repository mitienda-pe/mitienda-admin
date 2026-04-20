<template>
  <Dialog
    v-if="current"
    :visible="true"
    :modal="true"
    :closable="current.is_dismissible"
    :closeOnEscape="current.is_dismissible"
    :dismissableMask="false"
    :style="{ width: '560px', maxWidth: '95vw' }"
    :contentStyle="{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }"
    :header="current.title"
    @update:visible="onClose"
  >
    <div class="space-y-4">
      <div
        :class="[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          badgeClass(current.severity)
        ]"
      >
        <i :class="severityIcon(current.severity)" />
        {{ severityLabel(current.severity) }}
      </div>

      <img
        v-if="current.image_url"
        :src="current.image_url"
        :alt="current.title"
        class="w-full max-h-64 object-cover rounded-lg"
      />

      <div class="text-sm text-gray-700 broadcast-modal-body" v-html="renderBroadcastMarkdownBlock(current.body)" />

      <p v-if="!current.is_dismissible" class="text-xs text-orange-600 flex items-center gap-1">
        <i class="pi pi-lock" /> Este mensaje debe mantenerse visible.
      </p>
    </div>
    <template v-if="hasCta" #footer>
      <a
        :href="current.cta_url!"
        target="_blank"
        rel="noopener"
        class="p-button p-component"
        @click="handleCtaClick"
      >
        <span class="p-button-label">{{ current.cta_label }}</span>
      </a>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import type { BroadcastSeverity } from '@/types/broadcast.types'
import { renderBroadcastMarkdownBlock } from '@/utils/broadcast-markdown'

const store = useBroadcastsStore()

const current = computed(() => {
  const modals = store.activeModals
  if (modals.length === 0) return null
  const rank = (s: BroadcastSeverity) =>
    s === 'danger' ? 0 : s === 'warning' ? 1 : 2
  const blockingFirst = [...modals].sort((a, b) => {
    if (a.is_dismissible !== b.is_dismissible) {
      return a.is_dismissible ? 1 : -1
    }
    const byRank = rank(a.severity) - rank(b.severity)
    if (byRank !== 0) return byRank
    return (b.published_at || '').localeCompare(a.published_at || '')
  })
  return blockingFirst[0]
})

const hasCta = computed(
  () => !!(current.value?.cta_label && current.value?.cta_url)
)

function onClose(visible: boolean) {
  if (visible) return
  if (current.value?.is_dismissible) {
    store.dismiss(current.value.id)
  }
}

function handleCtaClick() {
  // Al abrir el CTA también marcamos visto si es cerrable
  if (current.value?.is_dismissible) {
    store.dismiss(current.value.id)
  }
}

function badgeClass(s: BroadcastSeverity) {
  switch (s) {
    case 'danger':  return 'bg-red-100 text-red-700'
    case 'warning': return 'bg-amber-100 text-amber-800'
    default:        return 'bg-teal-100 text-teal-800'
  }
}
function severityIcon(s: BroadcastSeverity) {
  switch (s) {
    case 'danger':  return 'pi pi-exclamation-circle'
    case 'warning': return 'pi pi-exclamation-triangle'
    default:        return 'pi pi-megaphone'
  }
}
function severityLabel(s: BroadcastSeverity) {
  return ({ info: 'Anuncio', warning: 'Advertencia', danger: 'Importante' })[s]
}
</script>

<style scoped>
.broadcast-modal-body :deep(p) { margin: 0 0 0.75rem; }
.broadcast-modal-body :deep(p:last-child) { margin-bottom: 0; }
.broadcast-modal-body :deep(ul),
.broadcast-modal-body :deep(ol) { margin: 0 0 0.75rem; padding-left: 1.25rem; }
.broadcast-modal-body :deep(ul) { list-style: disc; }
.broadcast-modal-body :deep(ol) { list-style: decimal; }
.broadcast-modal-body :deep(li) { margin: 0.15rem 0; }
.broadcast-modal-body :deep(strong) { font-weight: 600; color: #111827; }
.broadcast-modal-body :deep(a) { color: #00b2a6; text-decoration: underline; }
.broadcast-modal-body :deep(code) {
  background: #f3f4f6;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 0.85em;
}
.broadcast-modal-body :deep(blockquote) {
  border-left: 3px solid #e5e7eb;
  padding-left: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.75rem;
}
</style>
