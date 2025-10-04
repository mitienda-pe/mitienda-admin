<template>
  <Card class="stat-card">
    <template #content>
      <div class="stat-card__content">
        <div class="stat-card__header">
          <div class="stat-card__icon" :style="{ backgroundColor: iconBgColor }">
            <i :class="`pi ${icon}`" :style="{ color: iconColor }"></i>
          </div>
          <div v-if="change" class="stat-card__change">
            <Tag
              :value="`${change.percentage >= 0 ? '+' : ''}${change.percentage.toFixed(1)}%`"
              :severity="change.isPositive ? 'success' : 'danger'"
              :icon="`pi ${change.isPositive ? 'pi-arrow-up' : 'pi-arrow-down'}`"
            />
          </div>
        </div>

        <div class="stat-card__body">
          <p class="stat-card__label">{{ label }}</p>
          <h2 class="stat-card__value">{{ formattedValue }}</h2>
          <p v-if="subtitle" class="stat-card__subtitle">{{ subtitle }}</p>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import type { MetricChange } from '@/types/dashboard.types'

interface Props {
  label: string
  value: number | string
  icon: string
  iconColor?: string
  iconBgColor?: string
  change?: MetricChange
  subtitle?: string
  format?: 'currency' | 'number' | 'percentage' | 'text'
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#3b82f6',
  iconBgColor: '#dbeafe',
  format: 'number'
})

const formattedValue = computed(() => {
  if (props.format === 'currency') {
    return `S/ ${Number(props.value).toFixed(2)}`
  } else if (props.format === 'percentage') {
    return `${Number(props.value).toFixed(1)}%`
  } else if (props.format === 'number') {
    return Number(props.value).toLocaleString('es-PE')
  }
  return String(props.value)
})
</script>

<style scoped lang="scss">
.stat-card {
  height: 100%;

  :deep(.p-card-body) {
    padding: 1.5rem;
  }

  :deep(.p-card-content) {
    padding: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  &__change {
    :deep(.p-tag) {
      font-size: 0.75rem;
      font-weight: 600;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__label {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    font-weight: 500;
  }

  &__value {
    font-size: 2rem;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
  }
}
</style>
