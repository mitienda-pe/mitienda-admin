<script setup lang="ts">
import { computed } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import type { StoreScheduleDay } from '@/types/store.types'

interface Props {
  schedule: StoreScheduleDay[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:schedule': [schedule: StoreScheduleDay[]]
}>()

const DAY_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
}

const days = computed(() => props.schedule)

function toggleDay(index: number) {
  const updated = [...props.schedule]
  updated[index] = { ...updated[index], active: !updated[index].active }
  emit('update:schedule', updated)
}

function updateTime(index: number, field: 'open' | 'close', value: string) {
  const updated = [...props.schedule]
  updated[index] = { ...updated[index], [field]: value }
  emit('update:schedule', updated)
}

function dayLabel(day: string): string {
  return DAY_LABELS[day] || day
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(day, index) in days"
      :key="day.day"
      class="flex items-center gap-3 py-2 px-3 rounded-lg"
      :class="day.active ? 'bg-white border border-gray-200' : 'bg-gray-50'"
    >
      <!-- Day name -->
      <span class="w-24 text-sm font-medium" :class="day.active ? 'text-gray-700' : 'text-gray-400'">
        {{ dayLabel(day.day) }}
      </span>

      <!-- Toggle -->
      <InputSwitch :modelValue="day.active" @update:modelValue="toggleDay(index)" />

      <!-- Time inputs -->
      <template v-if="day.active">
        <input
          type="time"
          :value="day.open"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          @input="updateTime(index, 'open', ($event.target as HTMLInputElement).value)"
        />
        <span class="text-gray-400 text-sm">–</span>
        <input
          type="time"
          :value="day.close"
          class="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          @input="updateTime(index, 'close', ($event.target as HTMLInputElement).value)"
        />
      </template>
      <template v-else>
        <span class="text-sm text-gray-400 italic">Cerrado</span>
      </template>
    </div>
  </div>
</template>
