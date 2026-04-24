<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

interface CurtainConfig {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  maxWindows?: number
  unitLabel?: string
}

interface Props {
  config: CurtainConfig | null
  configSchema?: Record<string, any> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', config: CurtainConfig): void }>()

const form = reactive<CurtainConfig>({
  minWidth: props.config?.minWidth ?? 0.3,
  maxWidth: props.config?.maxWidth ?? 10,
  minHeight: props.config?.minHeight ?? 0.3,
  maxHeight: props.config?.maxHeight ?? 5,
  maxWindows: props.config?.maxWindows ?? 20,
  unitLabel: props.config?.unitLabel ?? 'm²',
})

watch(
  () => props.config,
  (next) => {
    if (!next) return
    Object.assign(form, {
      minWidth: next.minWidth ?? form.minWidth,
      maxWidth: next.maxWidth ?? form.maxWidth,
      minHeight: next.minHeight ?? form.minHeight,
      maxHeight: next.maxHeight ?? form.maxHeight,
      maxWindows: next.maxWindows ?? form.maxWindows,
      unitLabel: next.unitLabel ?? form.unitLabel,
    })
  },
)

const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(props.config ?? {}))

function submit() {
  emit('update', { ...form })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Ancho mínimo (m)</span>
        <input v-model.number="form.minWidth" type="number" min="0.1" step="0.1" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Ancho máximo (m)</span>
        <input v-model.number="form.maxWidth" type="number" min="0.1" step="0.1" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Alto mínimo (m)</span>
        <input v-model.number="form.minHeight" type="number" min="0.1" step="0.1" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Alto máximo (m)</span>
        <input v-model.number="form.maxHeight" type="number" min="0.1" step="0.1" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Máximo de ventanas</span>
        <input v-model.number="form.maxWindows" type="number" min="1" step="1" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-700">Unidad mostrada</span>
        <input v-model="form.unitLabel" type="text" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </label>
    </div>

    <div class="flex justify-end">
      <button
        type="submit"
        class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        :disabled="!isDirty"
      >
        Guardar cambios
      </button>
    </div>
  </form>
</template>
