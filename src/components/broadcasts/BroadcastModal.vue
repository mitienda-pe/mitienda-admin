<template>
  <Dialog
    v-if="current"
    :visible="true"
    :modal="true"
    :closable="current.is_dismissible"
    :closeOnEscape="current.is_dismissible"
    :dismissableMask="false"
    :style="{ width: '520px' }"
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

      <p class="text-sm text-gray-700 whitespace-pre-line">{{ current.body }}</p>

      <p v-if="!current.is_dismissible" class="text-xs text-orange-600 flex items-center gap-1">
        <i class="pi pi-lock" /> Este mensaje debe mantenerse visible.
      </p>
    </div>
    <template #footer>
      <Button
        v-if="current.is_dismissible"
        label="Entendido"
        severity="secondary"
        text
        @click="handleDismiss"
      />
      <a
        v-if="current.cta_label && current.cta_url"
        :href="current.cta_url"
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
import Button from 'primevue/button'
import { useBroadcastsStore } from '@/stores/broadcasts.store'
import type { BroadcastSeverity } from '@/types/broadcast.types'

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

function onClose(visible: boolean) {
  if (visible) return
  if (current.value?.is_dismissible) {
    store.dismiss(current.value.id)
  }
}

function handleDismiss() {
  if (current.value?.is_dismissible) store.dismiss(current.value.id)
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
