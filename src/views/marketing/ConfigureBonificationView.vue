<template>
  <div class="configure-bonification-view p-6">
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
      <!-- Configuration Card -->
      <div class="bg-white rounded-lg shadow">
        <!-- Header with quantities -->
        <div class="border-b border-gray-200 px-6 py-4">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Configuración de Bonificación</h2>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de productos a comprar <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="quantityToBuy"
                type="number"
                min="1"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ej: 2 (para 2x1)"
              />
              <p class="mt-1 text-xs text-gray-500">Para un 2x1, ingresa 2. Para un 3x2, ingresa 3.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Cantidad de productos a bonificar <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="quantityToGift"
                type="number"
                min="1"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ej: 1 (para 2x1)"
              />
              <p class="mt-1 text-xs text-gray-500">Para un 2x1, ingresa 1. Para un 3x2, ingresa 2.</p>
            </div>
          </div>
        </div>

        <!-- Product Selection -->
        <div class="px-6 py-4">
          <div class="grid grid-cols-[2fr_auto_2fr] gap-6">
            <!-- Left Panel: Available Products -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-3">
                Productos Disponibles
              </h3>

              <!-- Search -->
              <div class="mb-3">
                <div class="relative">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Buscar por nombre, SKU o código..."
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-10"
                    @input="debouncedSearch"
                  />
                  <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
              </div>

              <!-- Available Products List -->
              <div class="border rounded-lg h-96 overflow-y-auto bg-gray-50">
                <div v-if="isSearching" class="flex items-center justify-center h-full">
                  <div class="text-center">
                    <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
                    <p class="mt-2 text-xs text-gray-500">Buscando...</p>
                  </div>
                </div>

                <div v-else-if="availableProducts.length === 0" class="flex items-center justify-center h-full">
                  <p class="text-sm text-gray-500">
                    {{ searchQuery ? 'No se encontraron productos' : 'Escribe para buscar productos' }}
                  </p>
                </div>

                <div v-else>
                  <div
                    v-for="product in availableProducts"
                    :key="product.id"
                    class="p-3 border-b hover:bg-white cursor-pointer transition-colors"
                    :class="{ 'bg-indigo-50': selectedAvailable.includes(product.id) }"
                    @click="toggleAvailableSelection(product.id)"
                  >
                    <div class="flex items-center gap-3">
                      <input
                        type="checkbox"
                        :checked="selectedAvailable.includes(product.id)"
                        class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        @click.stop="toggleAvailableSelection(product.id)"
                      />
                      <img
                        v-if="product.images && product.images.length > 0"
                        :src="product.images[0].cloudflare_url || product.images[0].url"
                        :alt="product.name"
                        class="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
                        <p class="text-xs text-gray-500">SKU: {{ product.sku }}</p>
                        <p class="text-xs text-gray-900 font-medium">S/ {{ product.price }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p class="mt-2 text-xs text-gray-500">
                {{ selectedAvailable.length }} producto(s) seleccionado(s)
              </p>
            </div>

            <!-- Center: Transfer Buttons -->
            <div class="flex flex-col items-center justify-center gap-4">
              <!-- Move to Base Products -->
              <div class="text-center">
                <button
                  @click="moveToBase"
                  :disabled="selectedAvailable.length === 0"
                  class="inline-flex flex-col items-center justify-center w-32 h-20 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Agregar a productos base (que el cliente compra)"
                >
                  <i class="pi pi-arrow-right text-xl mb-1"></i>
                  <span class="text-xs">Productos Base</span>
                </button>
                <p class="mt-1 text-xs text-gray-600">Cliente compra</p>
              </div>

              <!-- Move to Bonification Products -->
              <div class="text-center">
                <button
                  @click="moveToBonification"
                  :disabled="selectedAvailable.length === 0"
                  class="inline-flex flex-col items-center justify-center w-32 h-20 rounded-lg bg-green-600 text-white shadow hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Agregar a productos bonificados (regalos)"
                >
                  <i class="pi pi-arrow-right text-xl mb-1"></i>
                  <span class="text-xs">Bonificación</span>
                </button>
                <p class="mt-1 text-xs text-gray-600">Regalo</p>
              </div>

              <div class="border-t w-full my-2"></div>

              <!-- Remove from Base -->
              <div class="text-center">
                <button
                  @click="removeFromBase"
                  :disabled="selectedBase.length === 0"
                  class="inline-flex flex-col items-center justify-center w-32 h-20 rounded-lg bg-gray-600 text-white shadow hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Quitar de productos base"
                >
                  <i class="pi pi-arrow-left text-xl mb-1"></i>
                  <span class="text-xs">Quitar</span>
                </button>
              </div>

              <!-- Remove from Bonification -->
              <div class="text-center">
                <button
                  @click="removeFromBonification"
                  :disabled="selectedBonification.length === 0"
                  class="inline-flex flex-col items-center justify-center w-32 h-20 rounded-lg bg-gray-600 text-white shadow hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Quitar de productos bonificados"
                >
                  <i class="pi pi-arrow-left text-xl mb-1"></i>
                  <span class="text-xs">Quitar</span>
                </button>
              </div>
            </div>

            <!-- Right Panel: Selected Products -->
            <div>
              <h3 class="text-sm font-semibold text-gray-900 mb-3">Productos Seleccionados</h3>

              <!-- Base Products -->
              <div class="mb-4">
                <h4 class="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <i class="pi pi-shopping-cart text-indigo-600"></i>
                  Productos Base (cliente compra)
                </h4>
                <div class="border rounded-lg h-44 overflow-y-auto bg-indigo-50">
                  <div v-if="baseProducts.length === 0" class="flex items-center justify-center h-full">
                    <p class="text-xs text-gray-500">Ningún producto agregado</p>
                  </div>
                  <div v-else>
                    <div
                      v-for="product in baseProducts"
                      :key="'base-' + product.id"
                      class="p-2 border-b hover:bg-white cursor-pointer transition-colors"
                      :class="{ 'bg-indigo-100': selectedBase.includes(product.id) }"
                      @click="toggleBaseSelection(product.id)"
                    >
                      <div class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          :checked="selectedBase.includes(product.id)"
                          class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          @click.stop="toggleBaseSelection(product.id)"
                        />
                        <img
                          v-if="product.images && product.images.length > 0"
                          :src="product.images[0].cloudflare_url || product.images[0].url"
                          :alt="product.name"
                          class="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-gray-900 truncate">{{ product.name }}</p>
                          <p class="text-xs text-gray-500">{{ product.sku }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="mt-1 text-xs text-gray-600">{{ baseProducts.length }} producto(s)</p>
              </div>

              <!-- Bonification Products -->
              <div>
                <h4 class="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <i class="pi pi-gift text-green-600"></i>
                  Productos Bonificados (regalos)
                </h4>
                <div class="border rounded-lg h-44 overflow-y-auto bg-green-50">
                  <div v-if="bonificationProducts.length === 0" class="flex items-center justify-center h-full">
                    <p class="text-xs text-gray-500">Ningún producto agregado</p>
                  </div>
                  <div v-else>
                    <div
                      v-for="product in bonificationProducts"
                      :key="'bonif-' + product.id"
                      class="p-2 border-b hover:bg-white cursor-pointer transition-colors"
                      :class="{ 'bg-green-100': selectedBonification.includes(product.id) }"
                      @click="toggleBonificationSelection(product.id)"
                    >
                      <div class="flex items-center gap-2">
                        <input
                          type="checkbox"
                          :checked="selectedBonification.includes(product.id)"
                          class="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          @click.stop="toggleBonificationSelection(product.id)"
                        />
                        <img
                          v-if="product.images && product.images.length > 0"
                          :src="product.images[0].cloudflare_url || product.images[0].url"
                          :alt="product.name"
                          class="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-medium text-gray-900 truncate">{{ product.name }}</p>
                          <p class="text-xs text-gray-500">{{ product.sku }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="mt-1 text-xs text-gray-600">{{ bonificationProducts.length }} producto(s)</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <router-link
            to="/marketing/promotions"
            class="inline-flex items-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-300"
          >
            <i class="pi pi-times mr-2"></i>
            Cancelar
          </router-link>

          <button
            @click="saveConfiguration"
            :disabled="!canSave || isSaving"
            class="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i class="pi pi-check mr-2"></i>
            {{ isSaving ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>
      </div>

      <!-- Help Section -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="flex gap-3">
          <i class="pi pi-info-circle text-blue-600 text-xl flex-shrink-0"></i>
          <div>
            <h4 class="text-sm font-semibold text-blue-900 mb-1">¿Cómo funciona?</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li><strong>Productos Base:</strong> Son los productos que el cliente debe comprar para recibir la bonificación.</li>
              <li><strong>Productos Bonificados:</strong> Son los productos que se regalan como bonificación.</li>
              <li><strong>Ejemplo 2x1:</strong> Cantidad a comprar = 2, Cantidad a bonificar = 1. El cliente compra 2 productos y recibe 1 gratis.</li>
              <li><strong>Ejemplo 3x2:</strong> Cantidad a comprar = 3, Cantidad a bonificar = 2. El cliente compra 3 productos y recibe 2 gratis.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePromotionsStore } from '@/stores/promotions.store'
import { productsApi } from '@/api/products.api'
import { storeToRefs } from 'pinia'
import type { Product } from '@/types/product.types'
import { useDebounceFn } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const promotionsStore = usePromotionsStore()

const { currentPromotion, isLoading } = storeToRefs(promotionsStore)

// Configuration
const quantityToBuy = ref(2) // Default for 2x1
const quantityToGift = ref(1) // Default for 2x1

// Products
const baseProducts = ref<Product[]>([])
const bonificationProducts = ref<Product[]>([])
const availableProducts = ref<Product[]>([])

// Selection states
const selectedAvailable = ref<number[]>([])
const selectedBase = ref<number[]>([])
const selectedBonification = ref<number[]>([])

// Search
const searchQuery = ref('')
const isSearching = ref(false)
const isSaving = ref(false)

// Computed
const canSave = computed(() => {
  return quantityToBuy.value > 0 &&
         quantityToGift.value > 0 &&
         baseProducts.value.length > 0 &&
         bonificationProducts.value.length > 0
})

// Search products with debounce
const debouncedSearch = useDebounceFn(async () => {
  await searchProducts()
}, 500)

async function searchProducts() {
  if (!searchQuery.value.trim()) {
    availableProducts.value = []
    return
  }

  try {
    isSearching.value = true
    const response = await productsApi.getProducts({
      search: searchQuery.value,
      limit: 50,
      page: 1
    })

    if (response.success && response.data) {
      // Filter out products already selected
      const baseIds = new Set(baseProducts.value.map(p => p.id))
      const bonifIds = new Set(bonificationProducts.value.map(p => p.id))

      availableProducts.value = response.data.filter(p =>
        !baseIds.has(p.id) && !bonifIds.has(p.id)
      )
    }
  } catch (error) {
    console.error('Error searching products:', error)
  } finally {
    isSearching.value = false
  }
}

// Selection toggles
function toggleAvailableSelection(productId: number) {
  const index = selectedAvailable.value.indexOf(productId)
  if (index > -1) {
    selectedAvailable.value.splice(index, 1)
  } else {
    selectedAvailable.value.push(productId)
  }
}

function toggleBaseSelection(productId: number) {
  const index = selectedBase.value.indexOf(productId)
  if (index > -1) {
    selectedBase.value.splice(index, 1)
  } else {
    selectedBase.value.push(productId)
  }
}

function toggleBonificationSelection(productId: number) {
  const index = selectedBonification.value.indexOf(productId)
  if (index > -1) {
    selectedBonification.value.splice(index, 1)
  } else {
    selectedBonification.value.push(productId)
  }
}

// Transfer functions
function moveToBase() {
  const productsToMove = availableProducts.value.filter(p =>
    selectedAvailable.value.includes(p.id)
  )

  baseProducts.value.push(...productsToMove)

  // Remove from available
  availableProducts.value = availableProducts.value.filter(p =>
    !selectedAvailable.value.includes(p.id)
  )

  selectedAvailable.value = []
}

function moveToBonification() {
  const productsToMove = availableProducts.value.filter(p =>
    selectedAvailable.value.includes(p.id)
  )

  bonificationProducts.value.push(...productsToMove)

  // Remove from available
  availableProducts.value = availableProducts.value.filter(p =>
    !selectedAvailable.value.includes(p.id)
  )

  selectedAvailable.value = []
}

function removeFromBase() {
  const productsToRemove = baseProducts.value.filter(p =>
    selectedBase.value.includes(p.id)
  )

  // Add back to available if they match search
  productsToRemove.forEach(product => {
    if (!searchQuery.value ||
        product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      availableProducts.value.push(product)
    }
  })

  // Remove from base
  baseProducts.value = baseProducts.value.filter(p =>
    !selectedBase.value.includes(p.id)
  )

  selectedBase.value = []
}

function removeFromBonification() {
  const productsToRemove = bonificationProducts.value.filter(p =>
    selectedBonification.value.includes(p.id)
  )

  // Add back to available if they match search
  productsToRemove.forEach(product => {
    if (!searchQuery.value ||
        product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      availableProducts.value.push(product)
    }
  })

  // Remove from bonification
  bonificationProducts.value = bonificationProducts.value.filter(p =>
    !selectedBonification.value.includes(p.id)
  )

  selectedBonification.value = []
}

// Save configuration
async function saveConfiguration() {
  if (!canSave.value || !currentPromotion.value) return

  try {
    isSaving.value = true
    const promotionId = currentPromotion.value.tiendapromocion_id

    // Link base products
    if (baseProducts.value.length > 0) {
      await promotionsStore.linkProducts(
        promotionId,
        baseProducts.value.map(p => ({ producto_id: p.id }))
      )
    }

    // Link bonification products
    if (bonificationProducts.value.length > 0) {
      await promotionsStore.linkBonifications(
        promotionId,
        bonificationProducts.value.map(p => ({ producto_id: p.id }))
      )
    }

    // Redirect back to list
    router.push('/marketing/promotions')
  } catch (error) {
    console.error('Error saving configuration:', error)
    alert('Error al guardar la configuración. Por favor intenta de nuevo.')
  } finally {
    isSaving.value = false
  }
}

// Load promotion on mount
onMounted(async () => {
  const promotionId = parseInt(route.params.id as string)
  if (promotionId) {
    await promotionsStore.fetchPromotion(promotionId)
  }
})
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
