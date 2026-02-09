<script setup lang="ts">
import { ref } from 'vue'
import type { BlockedDate } from '@/types/shipping.types'
import Calendar from 'primevue/calendar'
import { AppButton } from '@/components/ui'

interface Props {
  modelValue: BlockedDate[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: BlockedDate[]]
}>()

const selectedDate = ref<Date | null>(null)

function addDate() {
  if (!selectedDate.value) return
  const d = selectedDate.value
  const tuple: BlockedDate = [d.getFullYear(), d.getMonth() + 1, d.getDate()]

  // Check for duplicates
  const exists = props.modelValue.some(
    bd => bd[0] === tuple[0] && bd[1] === tuple[1] && bd[2] === tuple[2]
  )
  if (exists) {
    selectedDate.value = null
    return
  }

  const updated = [...props.modelValue, tuple].sort((a, b) => {
    if (a[0] !== b[0]) return a[0] - b[0]
    if (a[1] !== b[1]) return a[1] - b[1]
    return a[2] - b[2]
  })
  emit('update:modelValue', updated)
  selectedDate.value = null
}

function removeDate(index: number) {
  const updated = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', updated)
}

function formatDate(bd: BlockedDate): string {
  const day = String(bd[2]).padStart(2, '0')
  const month = String(bd[1]).padStart(2, '0')
  return `${day}/${month}/${bd[0]}`
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-end gap-3">
      <div class="flex-1">
        <Calendar
          v-model="selectedDate"
          dateFormat="dd/mm/yy"
          placeholder="Seleccionar fecha"
          :minDate="new Date()"
          class="w-full"
          showIcon
        />
      </div>
      <AppButton
        variant="outlined"
        @click="addDate"
        :disabled="!selectedDate"
      >
        <i class="pi pi-plus mr-1" />
        Agregar
      </AppButton>
    </div>

    <div v-if="modelValue.length > 0" class="space-y-1">
      <div
        v-for="(bd, index) in modelValue"
        :key="`${bd[0]}-${bd[1]}-${bd[2]}`"
        class="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded"
      >
        <span class="text-sm">{{ formatDate(bd) }}</span>
        <button
          type="button"
          class="text-red-500 hover:text-red-700 p-1"
          @click="removeDate(index)"
        >
          <i class="pi pi-trash text-sm" />
        </button>
      </div>
    </div>
    <p v-else class="text-sm text-gray-400 italic">
      No hay fechas bloqueadas
    </p>
  </div>
</template>
