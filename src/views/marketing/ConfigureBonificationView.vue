<template>
  <div class="configure-bonification-view">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/marketing/promotions" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
        <i class="pi pi-arrow-left"></i>
        Volver a promociones
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Configurar Bonificación</h1>
      <p v-if="currentPromotion" class="mt-1 text-sm text-gray-500">
        {{ currentPromotion.tiendapromocion_nombre }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando...</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="currentPromotion" class="space-y-6">
      <!-- Progress Steps -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <div v-for="(step, index) in steps" :key="index" class="flex-1">
            <div class="flex items-center">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors"
                :class="currentStep >= index + 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-500'"
              >
                <span v-if="currentStep > index + 1" class="text-lg">✓</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div v-if="index < steps.length - 1" class="flex-1 h-1 mx-2" :class="currentStep > index + 1 ? 'bg-indigo-600' : 'bg-gray-300'"></div>
            </div>
            <div class="mt-2">
              <p class="text-sm font-medium" :class="currentStep >= index + 1 ? 'text-gray-900' : 'text-gray-500'">
                {{ step }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="bg-white rounded-lg shadow p-6">
        <!-- Step 1: Productos Base -->
        <div v-if="currentStep === 1">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Paso 1: Productos Base</h2>
          <p class="text-sm text-gray-600 mb-6">
            Selecciona los productos que el cliente debe comprar para recibir la bonificación.
            Por ejemplo, en un "2x1", estos serían los productos que se compran.
          </p>

          <!-- Search and Add Products -->
          <div class="mb-6">
            <div class="flex gap-2 mb-4">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar productos por nombre, SKU o código de barras..."
                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                @keyup.enter="searchProducts"
              />
              <button
                @click="searchProducts"
                class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                :disabled="isSearching"
              >
                <i class="pi pi-search mr-2"></i>
                Buscar
              </button>
            </div>

            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="border rounded-lg overflow-hidden mb-4">
              <div class="max-h-64 overflow-y-auto">
                <div
                  v-for="product in searchResults"
                  :key="product.id"
                  class="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div class="flex items-center gap-3">
                    <img
                      v-if="product.images && product.images.length > 0"
                      :src="product.images[0].cloudflare_url || product.images[0].url"
                      :alt="product.name"
                      class="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p class="font-medium text-sm">{{ product.name }}</p>
                      <p class="text-xs text-gray-500">SKU: {{ product.sku }} | S/ {{ product.price }}</p>
                    </div>
                  </div>
                  <button
                    @click="addBaseProduct(product)"
                    class="inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-500"
                    :disabled="isProductInBase(product.id)"
                  >
                    <i class="pi pi-plus mr-1"></i>
                    {{ isProductInBase(product.id) ? 'Agregado' : 'Agregar' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Base Products -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">
              Productos Base Seleccionados ({{ baseProducts.length }})
            </h3>
            <div v-if="baseProducts.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <i class="pi pi-inbox text-4xl mb-2"></i>
              <p>No hay productos base seleccionados</p>
              <p class="text-sm">Busca y agrega productos arriba</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="product in baseProducts"
                :key="product.id"
                class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div class="flex items-center gap-3">
                  <img
                    v-if="product.images && product.images.length > 0"
                    :src="product.images[0].cloudflare_url || product.images[0].url"
                    :alt="product.name"
                    class="w-16 h-16 rounded object-cover"
                  />
                  <div>
                    <p class="font-medium">{{ product.name }}</p>
                    <p class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
                    <p class="text-sm text-gray-900">S/ {{ product.price }}</p>
                  </div>
                </div>
                <button
                  @click="removeBaseProduct(product.id)"
                  class="text-red-600 hover:text-red-800"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex justify-end mt-6">
            <button
              @click="nextStep"
              :disabled="baseProducts.length === 0"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente: Productos Bonificados
              <i class="pi pi-arrow-right ml-2"></i>
            </button>
          </div>
        </div>

        <!-- Step 2: Productos Bonificados -->
        <div v-if="currentStep === 2">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Paso 2: Productos Bonificados (Regalo)</h2>
          <p class="text-sm text-gray-600 mb-6">
            Selecciona los productos que el cliente recibirá de regalo al comprar los productos base.
            Por ejemplo, en un "2x1", este sería el producto que se regala.
          </p>

          <!-- Search and Add Products -->
          <div class="mb-6">
            <div class="flex gap-2 mb-4">
              <input
                v-model="bonificationSearchQuery"
                type="text"
                placeholder="Buscar productos para bonificar..."
                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                @keyup.enter="searchBonificationProducts"
              />
              <button
                @click="searchBonificationProducts"
                class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                :disabled="isSearchingBonification"
              >
                <i class="pi pi-search mr-2"></i>
                Buscar
              </button>
            </div>

            <!-- Search Results -->
            <div v-if="bonificationSearchResults.length > 0" class="border rounded-lg overflow-hidden mb-4">
              <div class="max-h-64 overflow-y-auto">
                <div
                  v-for="product in bonificationSearchResults"
                  :key="product.id"
                  class="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div class="flex items-center gap-3">
                    <img
                      v-if="product.images && product.images.length > 0"
                      :src="product.images[0].cloudflare_url || product.images[0].url"
                      :alt="product.name"
                      class="w-12 h-12 rounded object-cover"
                    />
                    <div>
                      <p class="font-medium text-sm">{{ product.name }}</p>
                      <p class="text-xs text-gray-500">SKU: {{ product.sku }} | S/ {{ product.price }}</p>
                    </div>
                  </div>
                  <button
                    @click="addBonificationProduct(product)"
                    class="inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-green-500"
                    :disabled="isProductInBonification(product.id)"
                  >
                    <i class="pi pi-plus mr-1"></i>
                    {{ isProductInBonification(product.id) ? 'Agregado' : 'Agregar' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Bonification Products -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">
              Productos para Bonificar ({{ bonificationProducts.length }})
            </h3>
            <div v-if="bonificationProducts.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <i class="pi pi-inbox text-4xl mb-2"></i>
              <p>No hay productos de bonificación seleccionados</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="product in bonificationProducts"
                :key="product.id"
                class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div class="flex items-center gap-3">
                  <img
                    v-if="product.images && product.images.length > 0"
                    :src="product.images[0].cloudflare_url || product.images[0].url"
                    :alt="product.name"
                    class="w-16 h-16 rounded object-cover"
                  />
                  <div>
                    <p class="font-medium">{{ product.name }}</p>
                    <p class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
                    <p class="text-sm text-gray-900">S/ {{ product.price }}</p>
                  </div>
                </div>
                <button
                  @click="removeBonificationProduct(product.id)"
                  class="text-red-600 hover:text-red-800"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex justify-between mt-6">
            <button
              @click="previousStep"
              class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
            >
              <i class="pi pi-arrow-left mr-2"></i>
              Anterior
            </button>
            <button
              @click="nextStep"
              :disabled="bonificationProducts.length === 0"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente: Reglas
              <i class="pi pi-arrow-right ml-2"></i>
            </button>
          </div>
        </div>

        <!-- Step 3: Reglas y Configuración -->
        <div v-if="currentStep === 3">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Paso 3: Reglas de la Bonificación</h2>
          <p class="text-sm text-gray-600 mb-6">
            Configura cómo funcionará la bonificación y cuándo se aplicará.
          </p>

          <!-- Coming Soon -->
          <div class="rounded-lg bg-yellow-50 p-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="pi pi-exclamation-triangle text-yellow-400 text-2xl"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-yellow-800">Configuración de Reglas - Próximamente</h3>
                <div class="mt-2 text-sm text-yellow-700">
                  <p class="mb-2">En esta sección podrás configurar:</p>
                  <ul class="list-disc list-inside space-y-1">
                    <li>Tipo de bonificación (2x1, 3x2, 3x1, etc.)</li>
                    <li>Forma de grupos (más económico, todos, especificar)</li>
                    <li>Monto mínimo de compra</li>
                    <li>Límites de uso</li>
                  </ul>
                  <p class="mt-3">Por ahora, puedes guardar con la configuración predeterminada.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="flex justify-between mt-6">
            <button
              @click="previousStep"
              class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
            >
              <i class="pi pi-arrow-left mr-2"></i>
              Anterior
            </button>
            <button
              @click="saveConfiguration"
              :disabled="isSaving"
              class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
            >
              <i class="pi pi-check mr-2"></i>
              {{ isSaving ? 'Guardando...' : 'Guardar y Finalizar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePromotionsStore } from '@/stores/promotions.store'
import { productsApi } from '@/api/products.api'
import { storeToRefs } from 'pinia'
import type { Product } from '@/types/product.types'

const route = useRoute()
const router = useRouter()
const promotionsStore = usePromotionsStore()

const { currentPromotion, isLoading } = storeToRefs(promotionsStore)

// Steps
const steps = ['Productos Base', 'Productos Bonificados', 'Reglas']
const currentStep = ref(1)

// Products
const baseProducts = ref<Product[]>([])
const bonificationProducts = ref<Product[]>([])

// Search
const searchQuery = ref('')
const searchResults = ref<Product[]>([])
const isSearching = ref(false)

const bonificationSearchQuery = ref('')
const bonificationSearchResults = ref<Product[]>([])
const isSearchingBonification = ref(false)

const isSaving = ref(false)

// Search products
async function searchProducts() {
  if (!searchQuery.value.trim()) return

  try {
    isSearching.value = true
    const response = await productsApi.getProducts({
      search: searchQuery.value,
      limit: 20,
      page: 1
    })

    if (response.success && response.data) {
      searchResults.value = response.data
    }
  } catch (error) {
    console.error('Error searching products:', error)
  } finally {
    isSearching.value = false
  }
}

async function searchBonificationProducts() {
  if (!bonificationSearchQuery.value.trim()) return

  try {
    isSearchingBonification.value = true
    const response = await productsApi.getProducts({
      search: bonificationSearchQuery.value,
      limit: 20,
      page: 1
    })

    if (response.success && response.data) {
      bonificationSearchResults.value = response.data
    }
  } catch (error) {
    console.error('Error searching products:', error)
  } finally {
    isSearchingBonification.value = false
  }
}

// Add/Remove products
function addBaseProduct(product: Product) {
  if (!isProductInBase(product.id)) {
    baseProducts.value.push(product)
  }
}

function removeBaseProduct(productId: number) {
  baseProducts.value = baseProducts.value.filter(p => p.id !== productId)
}

function isProductInBase(productId: number) {
  return baseProducts.value.some(p => p.id === productId)
}

function addBonificationProduct(product: Product) {
  if (!isProductInBonification(product.id)) {
    bonificationProducts.value.push(product)
  }
}

function removeBonificationProduct(productId: number) {
  bonificationProducts.value = bonificationProducts.value.filter(p => p.id !== productId)
}

function isProductInBonification(productId: number) {
  return bonificationProducts.value.some(p => p.id === productId)
}

// Navigation
function nextStep() {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Save configuration
async function saveConfiguration() {
  if (!currentPromotion.value) return

  try {
    isSaving.value = true

    // Link base products
    if (baseProducts.value.length > 0) {
      await promotionsStore.linkProducts(
        currentPromotion.value.tiendapromocion_id,
        baseProducts.value.map(p => ({ producto_id: p.id }))
      )
    }

    // Link bonification products
    if (bonificationProducts.value.length > 0) {
      await promotionsStore.linkBonifications(
        currentPromotion.value.tiendapromocion_id,
        bonificationProducts.value.map(p => ({ producto_id: p.id }))
      )
    }

    // Redirect to detail view
    router.push(`/marketing/promotions/${currentPromotion.value.tiendapromocion_id}`)
  } catch (error) {
    console.error('Error saving configuration:', error)
    alert('Error al guardar la configuración')
  } finally {
    isSaving.value = false
  }
}

// Initialize
onMounted(async () => {
  const promotionId = parseInt(route.params.id as string)
  if (promotionId) {
    await promotionsStore.fetchPromotion(promotionId)
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style>
