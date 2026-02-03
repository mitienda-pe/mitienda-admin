<template>
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="mb-6">
      <router-link
        :to="`/marketing/promotions/${promotionId}`"
        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
      >
        <i class="pi pi-arrow-left"></i>
        Volver a promociones
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Configurar Precio Rebajado</h1>
      <p v-if="currentPromotion" class="mt-1 text-sm text-gray-500">
        {{ currentPromotion.tiendapromocion_nombre }}
      </p>
      <div v-if="currentPromotion" class="mt-2 flex items-center gap-4 text-sm text-gray-600">
        <span>
          <strong>Descuento:</strong>
          {{ currentPromotion.tiendapromocion_tipodescuento === 1
            ? `${currentPromotion.tiendapromocion_valor}%`
            : `S/ ${currentPromotion.tiendapromocion_valor}` }}
        </span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="currentPromotion" class="space-y-6">
      <!-- Productos con Descuento Card -->
      <div class="bg-white shadow overflow-hidden rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-medium leading-6 text-gray-900">Productos con Descuento</h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ discountedProducts.length }} producto(s) vinculado(s) a esta promoción
              </p>
            </div>
            <Button
              label="Vincular Productos"
              icon="pi pi-plus"
              @click="showLinkProductsDialog = true"
              severity="primary"
            />
          </div>

          <!-- Products List -->
          <div v-if="discountedProducts.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Normal</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio con Descuento</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="product in discountedProducts" :key="product.producto_id">
                  <td class="px-4 py-4">
                    <div class="flex items-center">
                      <div v-if="product.producto_imagen" class="h-10 w-10 flex-shrink-0">
                        <img
                          class="h-10 w-10 rounded object-cover"
                          :src="getImageUrl(product.producto_imagen)"
                          :alt="product.producto_titulo"
                        />
                      </div>
                      <div :class="product.producto_imagen ? 'ml-4' : ''">
                        <div class="text-sm font-medium text-gray-900">{{ product.producto_titulo }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-500">{{ product.producto_sku }}</td>
                  <td class="px-4 py-4 text-sm text-gray-900">
                    S/ {{ Number(product.producto_precio).toFixed(2) }}
                  </td>
                  <td class="px-4 py-4 text-sm font-semibold text-green-600">
                    S/ {{ calculateDiscountedPrice(product).toFixed(2) }}
                    <span class="text-xs text-gray-500 ml-1">
                      ({{ currentPromotion.tiendapromocion_tipodescuento === 1
                        ? `-${currentPromotion.tiendapromocion_valor}%`
                        : `-S/ ${currentPromotion.tiendapromocion_valor}` }})
                    </span>
                  </td>
                  <td class="px-4 py-4 text-center">
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      @click="unlinkProduct(product.producto_id)"
                      v-tooltip.left="'Eliminar producto'"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-6 text-gray-500">
            No hay productos vinculados
          </div>
        </div>
      </div>

      <!-- Help Section -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="flex gap-3">
          <i class="pi pi-info-circle text-blue-600 text-xl flex-shrink-0"></i>
          <div>
            <h4 class="text-sm font-semibold text-blue-900 mb-1">¿Cómo funciona?</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li><strong>Productos con Descuento:</strong> Los productos que el cliente verá con el precio rebajado.</li>
              <li><strong>Tipo de Descuento:</strong>
                {{ currentPromotion.tiendapromocion_tipodescuento === 1
                  ? 'Porcentual - Se aplica un porcentaje de descuento sobre el precio normal'
                  : 'Monto Fijo - Se resta un monto fijo del precio normal' }}
              </li>
              <li><strong>Ejemplo:</strong> Si un producto cuesta S/ 100 y el descuento es
                {{ currentPromotion.tiendapromocion_tipodescuento === 1
                  ? `${currentPromotion.tiendapromocion_valor}%, el cliente pagará S/ ${(100 - (100 * currentPromotion.tiendapromocion_valor / 100)).toFixed(2)}`
                  : `S/ ${currentPromotion.tiendapromocion_valor}, el cliente pagará S/ ${(100 - currentPromotion.tiendapromocion_valor).toFixed(2)}` }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Link Products Dialog -->
    <LinkProductsDialog
      v-model:visible="showLinkProductsDialog"
      :promotion-id="promotionId"
      @linked="handleProductsLinked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePromotionsStore } from '@/stores/promotions.store'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import LinkProductsDialog from '@/components/promotions/LinkProductsDialog.vue'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'

const route = useRoute()
const toast = useToast()
const promotionsStore = usePromotionsStore()

const { currentPromotion, isLoading } = storeToRefs(promotionsStore)

const promotionId = computed(() => parseInt(route.params.id as string))

// Local state for products
const discountedProducts = ref<any[]>([])

// Dialog visibility
const showLinkProductsDialog = ref(false)

// Get image URL
function getImageUrl(imageName: string) {
  const cdnUrl = import.meta.env.VITE_CDN_URL || 'https://cdn.mitienda.pe'
  return `${cdnUrl}/images/${imageName}`
}

// Calculate discounted price
function calculateDiscountedPrice(product: any) {
  const normalPrice = Number(product.producto_precio)
  const discountType = currentPromotion.value?.tiendapromocion_tipodescuento
  const discountValue = Number(currentPromotion.value?.tiendapromocion_valor || 0)

  if (discountType === 1) {
    // Percentage discount
    return normalPrice - (normalPrice * discountValue / 100)
  } else {
    // Fixed amount discount
    return Math.max(0, normalPrice - discountValue)
  }
}

// Fetch products from backend
async function fetchProducts() {
  try {
    const productsResponse = await apiClient.get(`/promotions/${promotionId.value}/products`)

    if (productsResponse.data.status === 'success') {
      discountedProducts.value = productsResponse.data.data
    }
  } catch (error: any) {
    console.error('Error fetching products:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los productos',
      life: 3000
    })
  }
}

// Unlink product
async function unlinkProduct(productId: number) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return

  try {
    await apiClient.delete(`/promotions/${promotionId.value}/products/${productId}`)

    discountedProducts.value = discountedProducts.value.filter(p => p.producto_id !== productId)

    toast.add({
      severity: 'success',
      summary: 'Producto Eliminado',
      detail: 'El producto se eliminó correctamente',
      life: 2000
    })
  } catch (error: any) {
    console.error('Error unlinking product:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar el producto',
      life: 3000
    })
  }
}

// Handle products linked
async function handleProductsLinked() {
  await fetchProducts()
  toast.add({
    severity: 'success',
    summary: 'Productos Vinculados',
    detail: 'Los productos se vincularon correctamente',
    life: 2000
  })
}

// Initialize
onMounted(async () => {
  if (promotionId.value) {
    await promotionsStore.fetchPromotion(promotionId.value)
    await fetchProducts()
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
