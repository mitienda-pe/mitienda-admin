<template>
  <div class="risk-indicator">
    <div class="flex items-start gap-3">
      <!-- Icon based on risk level -->
      <div class="risk-icon" :class="`risk-${riskLevel}`">
        <i :class="riskIcon" class="text-lg"></i>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="text-sm font-medium text-secondary-700">
            {{ label }}
          </span>
          <span
            v-if="count !== null && count !== undefined"
            class="px-2 py-0.5 text-xs font-semibold rounded-full"
            :class="countBadgeClass"
          >
            {{ count }}
          </span>
        </div>

        <p
          v-if="description"
          class="text-xs text-secondary-500 leading-relaxed"
        >
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface RiskIndicatorProps {
  label: string
  riskLevel: 'low' | 'medium' | 'high'
  count?: number | null
  description?: string
}

const props = withDefaults(defineProps<RiskIndicatorProps>(), {
  count: null,
  description: '',
})

const riskIcon = computed(() => {
  switch (props.riskLevel) {
    case 'low':
      return 'pi pi-check-circle'
    case 'medium':
      return 'pi pi-exclamation-triangle'
    case 'high':
      return 'pi pi-times-circle'
    default:
      return 'pi pi-info-circle'
  }
})

const countBadgeClass = computed(() => {
  switch (props.riskLevel) {
    case 'low':
      return 'bg-green-100 text-green-700'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700'
    case 'high':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})
</script>

<style scoped>
.risk-indicator {
  @apply py-2;
}

.risk-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0;
}

.risk-icon.risk-low {
  @apply bg-green-100 text-green-600;
}

.risk-icon.risk-medium {
  @apply bg-yellow-100 text-yellow-600;
}

.risk-icon.risk-high {
  @apply bg-red-100 text-red-600;
}
</style>
