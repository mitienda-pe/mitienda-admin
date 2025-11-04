<script setup lang="ts">
import Button from 'primevue/button'
import { computed } from 'vue'

interface Props {
  label?: string
  icon?: string
  iconPos?: 'left' | 'right'
  variant?: 'primary' | 'secondary' | 'danger' | 'text' | 'outlined'
  size?: 'small' | 'normal' | 'large'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'normal',
  loading: false,
  disabled: false,
  type: 'button',
  block: false,
  iconPos: 'left'
})

defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const buttonClass = computed(() => {
  const classes: string[] = []

  // Block width
  if (props.block) {
    classes.push('w-full')
  }

  return classes.join(' ')
})

const severity = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'danger'
    case 'secondary':
      return 'secondary'
    default:
      return undefined
  }
})

const outlined = computed(() => props.variant === 'outlined')
const text = computed(() => props.variant === 'text')
const small = computed(() => props.size === 'small')
</script>

<template>
  <Button
    :label="label"
    :icon="icon"
    :iconPos="iconPos"
    :severity="severity"
    :outlined="outlined"
    :text="text"
    :size="small ? 'small' : undefined"
    :loading="loading"
    :disabled="disabled"
    :type="type"
    :class="buttonClass"
    @click="$emit('click', $event)"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </Button>
</template>

<style scoped>
/* Estilos específicos si necesitas override de PrimeVue */
</style>
