<template>
  <Card class="hover:shadow-lg transition-shadow cursor-pointer" @click="goToDetail">
    <template #header>
      <div class="relative aspect-square overflow-hidden bg-gray-100">
        <img
          :src="mainImage?.url || placeholderImage"
          :alt="product.name"
          class="w-full h-full object-cover"
        />

        <!-- Badges -->
        <div class="absolute top-2 right-2 flex flex-col gap-2">
          <Tag v-if="!product.published" value="No publicado" severity="secondary" />
          <Tag v-if="stockBadge" :value="stockBadge.label" :severity="stockBadge.severity" />
        </div>
      </div>
    </template>

    <template #content>
      <div class="space-y-2">
        <!-- Nombre -->
        <h3 class="font-semibold text-secondary line-clamp-2 min-h-[3rem]">{{ product.name }}</h3>

        <!-- SKU y Marca -->
        <div class="flex items-center gap-2 text-sm text-secondary-500">
          <span>{{ product.sku }}</span>
          <span v-if="product.brand" class="flex items-center gap-1">
            • <span>{{ product.brand.name }}</span>
          </span>
        </div>

        <!-- Precio -->
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-primary">{{ formatCurrency(product.price) }}</span>
          <span v-if="product.compare_price" class="text-sm text-secondary-400 line-through">
            {{ formatCurrency(product.compare_price) }}
          </span>
        </div>

        <!-- Stock -->
        <div class="flex items-center gap-2 text-sm">
          <i :class="['pi', stockIcon, stockColorClass]"></i>
          <span :class="stockColorClass">Stock: {{ product.stock }}</span>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import type { Product } from '@/types/product.types'
import { useFormatters } from '@/composables/useFormatters'
import placeholderImage from '@/assets/images/landscape-placeholder-svgrepo-com.svg'

interface Props {
  product: Product
}

const props = defineProps<Props>()
const router = useRouter()
const { formatCurrency } = useFormatters()

const mainImage = computed(() => {
  return props.product.images?.find(img => img.is_main) || props.product.images?.[0]
})

const stockBadge = computed(() => {
  if (props.product.stock === 0) {
    return { label: 'Agotado', severity: 'danger' as const }
  }
  if (props.product.min_stock && props.product.stock <= props.product.min_stock) {
    return { label: 'Stock bajo', severity: 'warning' as const }
  }
  return null
})

const stockIcon = computed(() => {
  if (props.product.stock === 0) return 'pi-times-circle'
  if (props.product.min_stock && props.product.stock <= props.product.min_stock) {
    return 'pi-exclamation-triangle'
  }
  return 'pi-check-circle'
})

const stockColorClass = computed(() => {
  if (props.product.stock === 0) return 'text-red-600'
  if (props.product.min_stock && props.product.stock <= props.product.min_stock) {
    return 'text-orange-600'
  }
  return 'text-green-600'
})

const goToDetail = () => {
  router.push(`/products/${props.product.id}`)
}
</script>
