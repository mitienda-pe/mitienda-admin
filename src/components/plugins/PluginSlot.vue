<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'

type LazyComponent = () => Promise<Component | { default: Component }>

const pluginComponents: Record<string, Record<string, LazyComponent>> = {
  'curtain-calculator': {
    'backoffice-settings': () => import('./curtain-calculator/BackofficeSettings.vue'),
    'backoffice-order-item': () => import('./curtain-calculator/BackofficeOrderItem.vue'),
  },
}

interface Props {
  slotName: string
  pluginSlug: string
  config?: Record<string, any> | null
  configSchema?: Record<string, any> | null
  pluginData?: Record<string, any> | null
  pluginSummary?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', config: Record<string, any>): void }>()

const AsyncPlugin = computed(() => {
  const loader = pluginComponents[props.pluginSlug]?.[props.slotName]
  return loader ? defineAsyncComponent(loader as any) : null
})

function onUpdate(config: Record<string, any>) {
  emit('update', config)
}
</script>

<template>
  <component
    :is="AsyncPlugin"
    v-if="AsyncPlugin"
    :config="config ?? {}"
    :config-schema="configSchema ?? null"
    :plugin-data="pluginData ?? null"
    :plugin-summary="pluginSummary ?? null"
    @update="onUpdate"
  />
  <div v-else class="text-sm text-gray-500">
    No hay interfaz disponible para este plugin.
  </div>
</template>
