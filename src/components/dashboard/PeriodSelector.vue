<template>
  <div class="flex gap-2">
    <Button
      v-for="option in periodOptions"
      :key="option.value"
      :label="option.label"
      :outlined="modelValue !== option.value"
      :severity="modelValue === option.value ? 'primary' : 'secondary'"
      size="small"
      @click="selectPeriod(option.value)"
    />
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import type { DashboardPeriod } from '@/types/dashboard.types'

interface Props {
  modelValue: DashboardPeriod
}

interface Emits {
  (e: 'update:modelValue', value: DashboardPeriod): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const periodOptions = [
  { label: 'Hoy', value: 'today' as DashboardPeriod },
  { label: 'Esta Semana', value: 'week' as DashboardPeriod },
  { label: 'Este Mes', value: 'month' as DashboardPeriod }
]

const selectPeriod = (period: DashboardPeriod) => {
  emit('update:modelValue', period)
}
</script>
