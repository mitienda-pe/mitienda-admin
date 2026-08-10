<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types/product.types'
import { useFormatters } from '@/composables/useFormatters'

interface Props {
  product: Product
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCurrency?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  showCurrency: true
})

const { currencySymbol } = useFormatters()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  }
  return sizes[props.size]
})

const displayPrice = computed(() => {
  const prefix = props.showCurrency ? `${currencySymbol.value} ` : ''

  // Si tiene variantes con rango de precios, mostrar "Desde: "
  if (props.product.has_variation_attributes && props.product.price_range?.has_range) {
    const minPrice = props.product.price_range.min?.toFixed(2) ?? '0.00'
    return `Desde: ${prefix}${minPrice}`
  }

  // Precio fijo o variantes con un solo precio
  const price = typeof props.product.price === 'number'
    ? props.product.price.toFixed(2)
    : '0.00'
  return `${prefix}${price}`
})
</script>

<template>
  <span
    :class="[sizeClasses, 'font-bold text-primary']"
  >
    {{ displayPrice }}
  </span>
</template>
