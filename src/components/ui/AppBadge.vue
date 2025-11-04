<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  label?: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  icon?: string
  size?: 'small' | 'normal'
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'normal',
  rounded: true
})

const badgeClasses = computed(() => {
  const classes: string[] = [
    'inline-flex items-center gap-1 font-medium'
  ]

  // Size
  if (props.size === 'small') {
    classes.push('px-2 py-0.5 text-xs')
  } else {
    classes.push('px-2.5 py-1 text-xs')
  }

  // Shape
  if (props.rounded) {
    classes.push('rounded-full')
  } else {
    classes.push('rounded')
  }

  // Variant colors
  switch (props.variant) {
    case 'success':
      classes.push('bg-green-100 text-green-800')
      break
    case 'warning':
      classes.push('bg-yellow-100 text-yellow-800')
      break
    case 'danger':
      classes.push('bg-red-100 text-red-800')
      break
    case 'info':
      classes.push('bg-blue-100 text-blue-800')
      break
    case 'neutral':
    default:
      classes.push('bg-gray-100 text-gray-800')
      break
  }

  return classes.join(' ')
})

const iconClasses = computed(() => {
  return props.size === 'small' ? 'text-[10px]' : 'text-xs'
})
</script>

<template>
  <span :class="badgeClasses">
    <i v-if="icon" :class="['pi', icon, iconClasses]"></i>
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
/* Estilos específicos si necesitas override */
</style>
