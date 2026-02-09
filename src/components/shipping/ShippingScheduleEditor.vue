<script setup lang="ts">
import type { ShippingSchedule, ShippingScheduleDay } from '@/types/shipping.types'
import InputSwitch from 'primevue/inputswitch'

interface Props {
  modelValue: ShippingSchedule | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: ShippingSchedule]
}>()

const DAY_NAMES: Record<string, string> = {
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
  '7': 'Domingo'
}

const DEFAULT_DAY: ShippingScheduleDay = {
  enabled: false,
  start: '09:00',
  end: '18:00'
}

function getSchedule(): ShippingSchedule {
  if (props.modelValue) return props.modelValue
  const schedule: ShippingSchedule = {}
  for (let i = 1; i <= 7; i++) {
    schedule[String(i)] = { ...DEFAULT_DAY }
  }
  return schedule
}

function updateDay(dayKey: string, field: keyof ShippingScheduleDay, value: unknown) {
  const schedule = { ...getSchedule() }
  schedule[dayKey] = {
    ...schedule[dayKey],
    [field]: value
  }
  emit('update:modelValue', schedule)
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="dayKey in ['1', '2', '3', '4', '5', '6', '7']"
      :key="dayKey"
      class="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0"
    >
      <div class="w-8">
        <InputSwitch
          :modelValue="getSchedule()[dayKey]?.enabled ?? false"
          @update:modelValue="updateDay(dayKey, 'enabled', $event)"
        />
      </div>
      <span class="w-24 text-sm font-medium text-secondary-700">
        {{ DAY_NAMES[dayKey] }}
      </span>
      <div
        v-if="getSchedule()[dayKey]?.enabled"
        class="flex items-center gap-2"
      >
        <input
          type="time"
          :value="getSchedule()[dayKey]?.start || '09:00'"
          class="border border-gray-300 rounded px-2 py-1 text-sm"
          @input="updateDay(dayKey, 'start', ($event.target as HTMLInputElement).value)"
        />
        <span class="text-sm text-gray-500">a</span>
        <input
          type="time"
          :value="getSchedule()[dayKey]?.end || '18:00'"
          class="border border-gray-300 rounded px-2 py-1 text-sm"
          @input="updateDay(dayKey, 'end', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <span v-else class="text-sm text-gray-400 italic">No disponible</span>
    </div>
  </div>
</template>
