<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'pi-inbox'
})

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="bg-white rounded-lg shadow p-12 text-center">
    <!-- Icon -->
    <i :class="['pi', icon, 'text-6xl text-secondary-300 mb-4']"></i>

    <!-- Title -->
    <h3 class="text-xl font-semibold text-secondary mb-2">
      {{ title }}
    </h3>

    <!-- Description -->
    <p v-if="description" class="text-secondary-600 mb-6">
      {{ description }}
    </p>

    <!-- Slot for custom content -->
    <div v-if="$slots.default" class="mb-6">
      <slot />
    </div>

    <!-- Action button -->
    <div v-if="actionLabel">
      <button
        class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors font-medium"
        @click="$emit('action')"
      >
        <i v-if="actionIcon" :class="['pi', actionIcon]"></i>
        {{ actionLabel }}
      </button>
    </div>

    <!-- Slot for custom actions -->
    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos si necesitas override */
</style>
