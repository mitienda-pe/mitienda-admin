<template>
  <Card class="shadow-sm hover:shadow-md transition-shadow">
    <template #content>
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm text-secondary-500 mb-1">{{ title }}</p>
          <h3 class="text-2xl font-bold text-secondary mb-2">{{ value }}</h3>
          <div v-if="change" class="flex items-center gap-1" :class="changeColorClass">
            <i :class="['pi text-xs', changeIcon]"></i>
            <span class="text-sm font-medium">{{ changeText }}</span>
          </div>
          <p v-if="subtitle" class="text-xs text-secondary-400 mt-1">{{ subtitle }}</p>
        </div>
        <div v-if="icon" class="w-12 h-12 rounded-lg flex items-center justify-center" :class="iconBgClass">
          <i :class="['pi text-xl', icon, iconColorClass]"></i>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  title: string
  value: string | number
  change?: {
    value: number
    percentage: number
    isPositive: boolean
  }
  subtitle?: string
  icon?: string
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const props = defineProps<Props>()
const { formatPercentage, getChangeColorClass, getChangeIcon } = useFormatters()

const changeText = computed(() => {
  if (!props.change) return ''
  return `${formatPercentage(props.change.percentage)} vs período anterior`
})

const changeColorClass = computed(() => {
  if (!props.change) return ''
  return getChangeColorClass(props.change.isPositive)
})

const changeIcon = computed(() => {
  if (!props.change) return ''
  return getChangeIcon(props.change.isPositive)
})

const iconBgClass = computed(() => {
  const colors = {
    primary: 'bg-primary-50',
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    danger: 'bg-red-50',
    info: 'bg-blue-50'
  }
  return colors[props.iconColor || 'primary']
})

const iconColorClass = computed(() => {
  const colors = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }
  return colors[props.iconColor || 'primary']
})
</script>
