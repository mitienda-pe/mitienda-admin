<template>
  <Dialog
    v-if="current"
    :visible="true"
    :modal="true"
    :closable="closable"
    :closeOnEscape="closable"
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
    <template v-if="hasCta || waitSeconds > 0" #footer>
      <div class="flex w-full flex-wrap items-center justify-end gap-3">
        <p
          v-if="waitSeconds > 0"
          class="mr-auto flex items-center gap-1.5 text-xs text-gray-500 tabular-nums"
        >
          <i class="pi pi-clock" />
          Podrás cerrar este aviso en {{ formatCountdown(waitSeconds) }}
        </p>
        <a
          v-if="hasCta"
          :href="current.cta_url!"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200"
          @click="handleCtaClick"
        >
          {{ current.cta_label }}
        </a>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import type { BroadcastSeverity } from '@/types/broadcast.types'
import { renderBroadcastMarkdownBlock } from '@/utils/broadcast-markdown'
import { formatCountdown } from '@/utils/broadcast-countdown'

const store = useBroadcastsStore()

const current = computed(() => store.currentModal)

const waitSeconds = computed(() =>
  current.value ? store.secondsUntilClosable(current.value) : 0
)
const closable = computed(() => !!current.value && store.canClose(current.value))

const hasCta = computed(
  () => !!(current.value?.cta_label && current.value?.cta_url)
)

function onClose(visible: boolean) {
  if (visible) return
  if (current.value && closable.value) {
    store.dismiss(current.value.id)
  }
}

function handleCtaClick() {
  // Al abrir el CTA también marcamos visto si es cerrable, aunque no haya
  // terminado la espera: hacer clic en la acción es lo que buscamos.
  if (current.value?.is_dismissible) {
    store.dismiss(current.value.id, { viaCta: true })
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
