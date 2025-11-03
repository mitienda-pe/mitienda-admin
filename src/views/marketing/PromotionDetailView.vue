<template>
  <div class="promotion-detail-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex h-64 items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p class="mt-2 text-sm text-gray-500">Cargando promoción...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-md bg-red-50 p-4">
      <div class="flex">
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error al cargar la promoción</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="currentPromotion">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <router-link to="/marketing/promotions" class="text-sm text-gray-500 hover:text-gray-700">
              ← Volver a promociones
            </router-link>
            <h1 class="mt-2 text-2xl font-bold text-gray-900">{{ currentPromotion.tiendapromocion_nombre }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ currentPromotion.promocion_nombre }}</p>
          </div>
          <div class="flex items-center space-x-3">
            <span
              v-if="currentPromotion.tiendapromocion_estado === 1"
              class="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800"
            >
              Activo
            </span>
            <span
              v-else
              class="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800"
            >
              Inactivo
            </span>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Info Card -->
          <div class="overflow-hidden rounded-lg bg-white shadow">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Información General</h3>
              <dl class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Nombre</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ currentPromotion.tiendapromocion_nombre }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Tipo de Promoción</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ currentPromotion.promocion_nombre }}</dd>
                </div>
                <div v-if="currentPromotion.tiendapromocion_codigo">
                  <dt class="text-sm font-medium text-gray-500">Código</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ currentPromotion.tiendapromocion_codigo }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Descuento</dt>
                  <dd class="mt-1 text-sm text-gray-900">
                    {{ currentPromotion.tiendapromocion_valor }}
                    {{ currentPromotion.tiendapromocion_tipodescuento === 1 ? '%' : 'S/' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(currentPromotion.tiendapromocion_fechainicio) }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Fecha de Caducidad</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formatDate(currentPromotion.tiendapromocion_fechacaducidad) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Products Card -->
          <div class="overflow-hidden rounded-lg bg-white shadow">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-medium leading-6 text-gray-900">Productos Vinculados</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ promotionProducts.length }} producto(s) vinculado(s) a esta promoción
                  </p>
                </div>
                <button
                  v-if="Number(currentPromotion.promocion_id) === 7"
                  @click="goToConfiguration"
                  class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configurar Bonificación
                </button>
                <button
                  v-else
                  @click="showLinkProductsDialog = true"
                  class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Vincular Productos
                </button>
              </div>

              <!-- Products List -->
              <div v-if="promotionProducts.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="product in promotionProducts" :key="product.producto_id">
                      <td class="whitespace-nowrap px-4 py-4">
                        <div class="flex items-center">
                          <div v-if="product.producto_imagen" class="h-10 w-10 flex-shrink-0">
                            <img class="h-10 w-10 rounded object-cover" :src="getImageUrl(product.producto_imagen)" :alt="product.producto_titulo" />
                          </div>
                          <div :class="product.producto_imagen ? 'ml-4' : ''">
                            <div class="text-sm font-medium text-gray-900">{{ product.producto_titulo }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{{ product.producto_sku }}</td>
                      <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">S/ {{ product.producto_precio }}</td>
                      <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                        {{ product.producto_stockilimitado ? 'Ilimitado' : product.producto_stock }}
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

          <!-- Bonification Products (for type 7) -->
          <div v-if="Number(currentPromotion.promocion_id) === 7" class="overflow-hidden rounded-lg bg-white shadow">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Productos de Bonificación</h3>
              <p class="text-sm text-gray-500 mb-4">
                {{ bonificationProducts.length }} producto(s) que se bonifican en esta promoción
              </p>

              <!-- Bonification Products List -->
              <div v-if="bonificationProducts.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atributo</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="product in bonificationProducts" :key="`${product.producto_id}-${product.productoatributo_id}`">
                      <td class="whitespace-nowrap px-4 py-4">
                        <div class="flex items-center">
                          <div v-if="product.producto_imagen" class="h-10 w-10 flex-shrink-0">
                            <img class="h-10 w-10 rounded object-cover" :src="getImageUrl(product.producto_imagen)" :alt="product.producto_titulo" />
                          </div>
                          <div :class="product.producto_imagen ? 'ml-4' : ''">
                            <div class="text-sm font-medium text-gray-900">{{ product.producto_titulo }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{{ product.producto_sku }}</td>
                      <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                        {{ product.producto_atributo_nombre || 'Sin atributo' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center py-6 text-gray-500">
                No hay productos de bonificación
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <!-- Status Card -->
          <div class="overflow-hidden rounded-lg bg-white shadow mb-6">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Estado</h3>
              <div class="space-y-4">
                <!-- Activation Toggle -->
                <div class="flex items-center justify-between">
                  <div>
                    <label for="status-toggle" class="text-sm font-medium text-gray-700">
                      Activar/Desactivar Promoción
                    </label>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ isPromotionActive ? 'La promoción está activa' : 'La promoción está inactiva' }}
                    </p>
                  </div>
                  <InputSwitch
                    id="status-toggle"
                    v-model="isPromotionActive"
                    :disabled="isUpdatingStatus"
                  />
                </div>

                <!-- Status Display -->
                <div class="pt-3 border-t border-gray-200">
                  <span class="text-sm text-gray-500">Estado actual:</span>
                  <span
                    v-if="currentPromotion.tiendapromocion_estado === 1"
                    class="ml-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
                  >
                    Activo
                  </span>
                  <span
                    v-else
                    class="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800"
                  >
                    Inactivo
                  </span>
                </div>

                <div v-if="currentPromotion.is_active_period !== undefined">
                  <span class="text-sm text-gray-500">Período:</span>
                  <span
                    v-if="currentPromotion.is_active_period === 1"
                    class="ml-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"
                  >
                    Vigente ({{ currentPromotion.days_until_expiry }} días)
                  </span>
                  <span
                    v-else
                    class="ml-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"
                  >
                    Fuera de período
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Card -->
          <div class="overflow-hidden rounded-lg bg-white shadow">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Acciones</h3>
              <div class="space-y-3">
                <button
                  @click="handleEdit"
                  class="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Editar Promoción
                </button>
                <button
                  @click="confirmDelete"
                  class="w-full inline-flex justify-center items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                >
                  Eliminar Promoción
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Link Products Dialog -->
    <LinkProductsDialog
      v-model:visible="showLinkProductsDialog"
      :promotion-id="currentPromotion?.tiendapromocion_id || null"
      @linked="handleProductsLinked"
    />

    <!-- Edit Promotion Dialog -->
    <EditPromotionDialog
      v-model:visible="showEditDialog"
      :promotion="currentPromotion"
      @updated="handlePromotionEdited"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePromotionsStore } from '@/stores/promotions.store'
import { storeToRefs } from 'pinia'
import InputSwitch from 'primevue/inputswitch'
import LinkProductsDialog from '@/components/promotions/LinkProductsDialog.vue'
import EditPromotionDialog from '@/components/promotions/EditPromotionDialog.vue'

const route = useRoute()
const router = useRouter()
const promotionsStore = usePromotionsStore()

const { currentPromotion, promotionProducts, bonificationProducts, isLoading, error } = storeToRefs(promotionsStore)

// Dialogs
const showLinkProductsDialog = ref(false)
const showEditDialog = ref(false)

// Status toggle
const isUpdatingStatus = ref(false)
const isPromotionActive = computed({
  get() {
    return currentPromotion.value?.tiendapromocion_estado === 1
  },
  async set(newValue: boolean) {
    if (!currentPromotion.value || isUpdatingStatus.value) return

    console.log('Toggle changed to:', newValue)
    console.log('Current status:', currentPromotion.value.tiendapromocion_estado)

    try {
      isUpdatingStatus.value = true
      const newStatus = newValue ? 1 : 0

      console.log('Updating to status:', newStatus)

      await promotionsStore.modifyPromotion(currentPromotion.value.tiendapromocion_id, {
        tiendapromocion_estado: newStatus
      })

      // Refresh to get updated data
      await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
      console.log('Status updated successfully')
    } catch (error) {
      console.error('Error toggling status:', error)
      alert('Error al cambiar el estado de la promoción')
    } finally {
      isUpdatingStatus.value = false
    }
  }
})

// Get image URL
function getImageUrl(imageName: string) {
  // TODO: Use CDN_AMAZON from config
  return `https://cdn.mitienda.pe/images/${imageName}`
}

// Format date
function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
}

// Go to configuration page (for bonifications)
function goToConfiguration() {
  if (!currentPromotion.value) return
  router.push(`/marketing/promotions/${currentPromotion.value.tiendapromocion_id}/configure`)
}

// Open edit dialog
function handleEdit() {
  showEditDialog.value = true
}

// Handle promotion edited
async function handlePromotionEdited() {
  if (!currentPromotion.value) return
  await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
}

// Confirm delete
async function confirmDelete() {
  if (!currentPromotion.value) return

  if (confirm(`¿Estás seguro de que deseas eliminar la promoción "${currentPromotion.value.tiendapromocion_nombre}"?`)) {
    try {
      await promotionsStore.removePromotion(currentPromotion.value.tiendapromocion_id)
      router.push('/marketing/promotions')
    } catch (error) {
      console.error('Error deleting promotion:', error)
    }
  }
}

// Handle products linked
async function handleProductsLinked(products: Array<{ producto_id: number }>) {
  if (!currentPromotion.value) return

  try {
    await promotionsStore.linkProducts(currentPromotion.value.tiendapromocion_id, products)
  } catch (error) {
    console.error('Error linking products:', error)
    alert('Error al vincular productos')
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
