<template>
  <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
    <!-- Presets -->
    <div class="flex gap-1">
      <button
        v-for="preset in presets"
        :key="preset.key"
        class="px-3 py-1.5 text-sm rounded-lg transition-colors"
        :class="
          activePreset === preset.key
            ? 'bg-primary text-white'
            : 'bg-white text-secondary-600 hover:bg-secondary-50 border border-secondary-200'
        "
        @click="applyPreset(preset.key)"
      >
        {{ preset.label }}
      </button>
    </div>

    <!-- Custom date range -->
    <div class="flex items-center gap-2">
      <Calendar
        v-model="dateRange"
        selection-mode="range"
        date-format="dd/mm/yy"
        placeholder="Rango personalizado"
        :max-date="today"
        show-icon
        class="w-64"
        @date-select="onDateSelect"
      />
    </div>

    <!-- Compare toggle -->
    <label class="flex items-center gap-2 cursor-pointer text-sm text-secondary-600">
      <InputSwitch v-model="compare" @update:model-value="onCompareChange" />
      <span>Comparar</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Calendar from 'primevue/calendar'
import InputSwitch from 'primevue/inputswitch'

interface Props {
  dateFrom: string
  dateTo: string
  compareEnabled: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:dateRange': [dateFrom: string, dateTo: string]
  'update:compare': [value: boolean]
}>()

const today = new Date()
const compare = ref(props.compareEnabled)
const dateRange = ref<Date[] | null>(null)

const presets = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: 'this_month', label: 'Este mes' },
  { key: '90d', label: '90 días' }
]

const activePreset = ref<string | null>('30d')

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function applyPreset(key: string) {
  activePreset.value = key
  const now = new Date()
  let from: Date

  switch (key) {
    case 'today':
      from = new Date(now)
      break
    case '7d':
      from = new Date(now)
      from.setDate(now.getDate() - 6)
      break
    case '30d':
      from = new Date(now)
      from.setDate(now.getDate() - 29)
      break
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case '90d':
      from = new Date(now)
      from.setDate(now.getDate() - 89)
      break
    default:
      return
  }

  dateRange.value = [from, now]
  emit('update:dateRange', formatDate(from), formatDate(now))
}

function onDateSelect() {
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[1]) {
    activePreset.value = null
    emit('update:dateRange', formatDate(dateRange.value[0]), formatDate(dateRange.value[1]))
  }
}

function onCompareChange(val: boolean) {
  emit('update:compare', val)
}

watch(
  () => props.compareEnabled,
  val => {
    compare.value = val
  }
)
</script>
