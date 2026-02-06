<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reviewsApi } from '@/api/reviews.api'
import { useFormatters } from '@/composables/useFormatters'
import Card from 'primevue/card'
import Button from 'primevue/button'
import StarRating from './StarRating.vue'
import type { ProductRating, ProductReview } from '@/types/review.types'

const props = defineProps<{
  productId: number
}>()

const router = useRouter()
const { formatDate } = useFormatters()

const rating = ref<ProductRating | null>(null)
const reviews = ref<ProductReview[]>([])
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const [ratingRes, reviewsRes] = await Promise.all([
      reviewsApi.getProductRating(props.productId),
      reviewsApi.getProductReviews(props.productId, 5),
    ])
    if (ratingRes.success && ratingRes.data) rating.value = ratingRes.data
    if (reviewsRes.success && reviewsRes.data) reviews.value = reviewsRes.data
  } catch (err) {
    console.error('Error loading product reviews:', err)
  } finally {
    isLoading.value = false
  }
})

const maxCount = (dist: Record<number, number>) => {
  return Math.max(...Object.values(dist), 1)
}

const goToAllReviews = () => {
  router.push(`/reviews?product_id=${props.productId}`)
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-star"></i>
          Opiniones
        </div>
        <Button
          v-if="rating && rating.total > 0"
          label="Ver todas"
          text
          size="small"
          @click="goToAllReviews"
        />
      </div>
    </template>
    <template #content>
      <div v-if="isLoading" class="flex justify-center py-4">
        <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
      </div>

      <div v-else-if="!rating || rating.total === 0" class="text-center py-4 text-gray-500">
        <i class="pi pi-star text-3xl mb-2 block"></i>
        <p class="text-sm">Sin opiniones aún</p>
      </div>

      <div v-else class="space-y-4">
        <!-- Rating Summary -->
        <div class="flex items-center gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-gray-900">{{ rating.avg_rating }}</p>
            <StarRating :rating="Math.round(rating.avg_rating)" size="sm" />
            <p class="text-xs text-gray-500 mt-1">{{ rating.total }} opiniones</p>
          </div>
          <div class="flex-1 space-y-1">
            <div
              v-for="stars in [5, 4, 3, 2, 1]"
              :key="stars"
              class="flex items-center gap-2"
            >
              <span class="text-xs text-gray-500 w-3">{{ stars }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  class="bg-yellow-400 rounded-full h-2 transition-all"
                  :style="{
                    width:
                      (((rating.distribution[stars] || 0) / maxCount(rating.distribution)) * 100) +
                      '%',
                  }"
                />
              </div>
              <span class="text-xs text-gray-400 w-5 text-right">{{
                rating.distribution[stars] || 0
              }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Reviews -->
        <div v-if="reviews.length > 0" class="border-t pt-3 space-y-3">
          <div v-for="review in reviews" :key="review.id" class="border-b border-gray-100 pb-3 last:border-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900">{{ review.customer_name }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(review.created_at) }}</span>
            </div>
            <StarRating :rating="review.rating" size="sm" />
            <p v-if="review.comment" class="text-sm text-gray-600 mt-1">{{ review.comment }}</p>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
