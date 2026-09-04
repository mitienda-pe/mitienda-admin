<template>
  <button
    v-if="show"
    type="button"
    :disabled="loading"
    class="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors px-2.5 py-1 text-xs font-medium whitespace-nowrap"
    v-tooltip.bottom="tooltip"
    :aria-label="tooltip"
    @click="$emit('exit')"
  >
    <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-shield'" class="text-[11px]"></i>
    <span class="hidden sm:inline">Superadmin</span>
    <i v-if="!loading" class="pi pi-sign-out text-[11px] opacity-70"></i>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  storeName?: string
  loading?: boolean
}

const props = defineProps<Props>()

defineEmits<{ (e: 'exit'): void }>()

const tooltip = computed(() =>
  props.storeName
    ? `Estás viendo ${props.storeName} como super-administrador. Clic para salir.`
    : 'Estás navegando como super-administrador. Clic para salir.'
)
</script>
