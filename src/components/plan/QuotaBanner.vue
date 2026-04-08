<template>
  <div
    v-if="isVisible"
    class="rounded-lg border p-4 mb-4"
    :class="isAtLimit ? 'bg-amber-50 border-amber-200' : 'bg-primary/5 border-primary/20'"
  >
    <div class="flex items-start gap-3">
      <i
        class="text-lg mt-0.5"
        :class="isAtLimit ? 'pi pi-exclamation-triangle text-amber-500' : 'pi pi-info-circle text-primary/80'"
      ></i>
      <div class="flex-1">
        <p class="text-sm font-medium" :class="isAtLimit ? 'text-amber-800' : 'text-primary'">
          {{ isAtLimit ? `Has alcanzado el limite de ${resourceLabel}` : `${resourceLabel}: ${current} de ${max}` }}
        </p>

        <!-- Progress bar -->
        <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all"
            :class="isAtLimit ? 'bg-amber-500' : 'bg-primary'"
            :style="{ width: `${percentage}%` }"
          ></div>
        </div>

        <div class="mt-2 flex items-center justify-between">
          <span class="text-xs" :class="isAtLimit ? 'text-amber-600' : 'text-primary'">
            {{ current }} / {{ max }} usados
          </span>
          <a
            v-if="isAtLimit"
            href="https://mitienda.pe/planes"
            target="_blank"
            class="text-xs font-medium text-primary hover:underline"
          >
            Mejorar Plan
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  max: number
  resourceLabel: string
}>()

const isVisible = computed(() => props.max > 0)

const percentage = computed(() => {
  if (props.max <= 0) return 0
  return Math.min(100, Math.round((props.current / props.max) * 100))
})

const isAtLimit = computed(() => {
  if (props.max <= 0) return false
  return props.current >= props.max
})
</script>
