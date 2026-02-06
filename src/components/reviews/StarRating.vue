<script setup lang="ts">
defineProps<{
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}>()

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}
</script>

<template>
  <div class="inline-flex items-center gap-1">
    <i
      v-for="star in 5"
      :key="star"
      class="pi"
      :class="[
        star <= rating ? 'pi-star-fill text-yellow-400' : 'pi-star text-gray-300',
        sizeClass[size || 'md'],
      ]"
    />
    <span
      v-if="showValue"
      class="ml-1 font-semibold"
      :class="sizeClass[size || 'md']"
    >
      {{ rating }}
    </span>
  </div>
</template>
