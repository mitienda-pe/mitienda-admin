<template>
  <div>
    <!-- Breadcrumb -->
    <div class="mb-4">
      <Button
        label="Volver a productos"
        icon="pi pi-arrow-left"
        text
        @click="router.push('/products')"
      />
    </div>

    <!-- Loading -->
    <div v-if="productsStore.isLoading" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <Message v-else-if="productsStore.error" severity="error">
      {{ productsStore.error }}
    </Message>

    <!-- Detalle del producto -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Galería de imágenes -->
      <Card>
        <template #content>
          <Galleria
            v-if="product.images && product.images.length > 0"
            :value="product.images"
            :num-visible="5"
            container-style="max-width: 100%"
          >
            <template #item="{ item }">
              <img :src="item.url" :alt="product.name" class="w-full h-96 object-contain" />
            </template>
            <template #thumbnail="{ item }">
              <img :src="item.thumbnail || item.url" :alt="product.name" class="w-20 h-20 object-cover" />
            </template>
          </Galleria>
          <div v-else class="w-full h-96 bg-gray-200 flex items-center justify-center">
            <i class="pi pi-image text-6xl text-gray-400"></i>
          </div>
        </template>
      </Card>

      <!-- Información del producto -->
      <div class="space-y-6">
        <!-- Header -->
        <Card>
          <template #content>
            <div class="space-y-4">
              <div>
                <h1 class="text-3xl font-bold text-secondary mb-2">{{ product.name }}</h1>
                <p class="text-secondary-500">SKU: {{ product.sku }}</p>
              </div>

              <!-- Badges -->
              <div class="flex gap-2">
                <Tag :value="product.published ? 'Publicado' : 'No publicado'" :severity="product.published ? 'success' : 'secondary'" />
                <Tag v-if="product.featured" value="Destacado" severity="info" />
                <Tag :value="stockLabel" :severity="stockSeverity" />
              </div>

              <!-- Precio -->
              <div>
                <div class="flex items-baseline gap-3">
                  <span class="text-4xl font-bold text-primary">{{ formatCurrency(product.price) }}</span>
                  <span v-if="product.compare_price" class="text-xl text-secondary-400 line-through">
                    {{ formatCurrency(product.compare_price) }}
                  </span>
                </div>
                <p v-if="product.cost" class="text-sm text-secondary-500 mt-1">
                  Costo: {{ formatCurrency(product.cost) }}
                </p>
              </div>

              <!-- Descripción -->
              <div v-if="product.description">
                <h3 class="font-semibold text-secondary mb-2">Descripción</h3>
                <p class="text-secondary-600">{{ product.description }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Detalles adicionales -->
        <Card>
          <template #title>
            <span class="text-lg">Información Adicional</span>
          </template>
          <template #content>
            <div class="space-y-3">
              <!-- Categoría -->
              <div v-if="product.category" class="flex justify-between">
                <span class="text-secondary-600">Categoría:</span>
                <span class="font-medium">{{ product.category.name }}</span>
              </div>

              <!-- Marca -->
              <div v-if="product.brand" class="flex justify-between">
                <span class="text-secondary-600">Marca:</span>
                <span class="font-medium">{{ product.brand.name }}</span>
              </div>

              <Divider />

              <!-- Stock -->
              <div class="flex justify-between">
                <span class="text-secondary-600">Stock:</span>
                <span class="font-medium" :class="stockColorClass">{{ product.stock }} unidades</span>
              </div>

              <!-- Stock mínimo -->
              <div v-if="product.min_stock" class="flex justify-between">
                <span class="text-secondary-600">Stock mínimo:</span>
                <span class="font-medium">{{ product.min_stock }} unidades</span>
              </div>

              <!-- Peso -->
              <div v-if="product.weight" class="flex justify-between">
                <span class="text-secondary-600">Peso:</span>
                <span class="font-medium">{{ product.weight }} kg</span>
              </div>

              <Divider />

              <!-- Fechas -->
              <div class="flex justify-between">
                <span class="text-secondary-600">Creado:</span>
                <span class="font-medium">{{ formatDate(product.created_at) }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-secondary-600">Actualizado:</span>
                <span class="font-medium">{{ formatDate(product.updated_at) }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-box text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">Producto no encontrado</h3>
      <Button label="Volver a productos" @click="router.push('/products')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products.store'
import { useFormatters } from '@/composables/useFormatters'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import Galleria from 'primevue/galleria'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const { formatCurrency, formatDate } = useFormatters()

const product = computed(() => productsStore.currentProduct)

const stockLabel = computed(() => {
  if (!product.value) return ''
  if (product.value.stock === 0) return 'Agotado'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'Stock bajo'
  }
  return 'En stock'
})

const stockSeverity = computed((): 'success' | 'warning' | 'danger' => {
  if (!product.value) return 'danger'
  if (product.value.stock === 0) return 'danger'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'warning'
  }
  return 'success'
})

const stockColorClass = computed(() => {
  if (!product.value) return 'text-red-600'
  if (product.value.stock === 0) return 'text-red-600'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'text-orange-600'
  }
  return 'text-green-600'
})

onMounted(() => {
  const productId = Number(route.params.id)
  if (productId) {
    productsStore.fetchProduct(productId)
  }
})
</script>
