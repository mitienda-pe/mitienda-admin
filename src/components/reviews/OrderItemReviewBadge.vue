<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { reviewsApi } from '@/api/reviews.api'
import type { OrderItemReview } from '@/types/review.types'

const props = defineProps<{
  orderId: number
}>()

const items = ref<OrderItemReview[]>([])
const isLoaded = ref(false)

onMounted(async () => {
  try {
    const response = await reviewsApi.getOrderReviews(props.orderId)
    if (response.success && response.data) {
      items.value = response.data
    }
  } catch (err) {
    console.error('Error loading order reviews:', err)
  } finally {
    isLoaded.value = true
  }
})

const getReviewForProduct = (productId: number) => {
  return items.value.find((i) => i.product_id === productId)
}

defineExpose({ getReviewForProduct, isLoaded })
</script>

<template>
  <slot :getReviewForProduct="getReviewForProduct" :isLoaded="isLoaded" :items="items" />
</template>
