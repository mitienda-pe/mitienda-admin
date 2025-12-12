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
                      <th v-if="Number(currentPromotion.promocion_id) === 7" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Cantidad</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Acciones</th>
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
                      <td v-if="Number(currentPromotion.promocion_id) === 7" class="px-4 py-4">
                        <InputNumber
                          v-model="product.productopromocion_cantidadproducto"
                          :min="1"
                          :maxFractionDigits="0"
                          :useGrouping="false"
                          @blur="validateAndUpdateProductQuantity(product)"
                          inputClass="w-full text-center"
                          class="w-20"
                        />
                      </td>
                      <td class="px-4 py-4 text-center">
                        <button
                          @click="unlinkProduct(product.producto_id)"
                          class="text-red-600 hover:text-red-900"
                          title="Eliminar producto"
                        >
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-medium leading-6 text-gray-900">Productos de Bonificación</h3>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ bonificationProducts.length }} producto(s) que se bonifican en esta promoción
                  </p>
                </div>
                <button
                  @click="showLinkBonificationsDialog = true"
                  class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                >
                  <svg class="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Vincular Bonificaciones
                </button>
              </div>

              <!-- Bonification Products List -->
              <div v-if="bonificationProducts.length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Cantidad</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <tr v-for="product in bonificationProducts" :key="`${product.producto_id}-${product.productoatributo_id || 0}`">
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
                      <td class="px-4 py-4">
                        <div class="flex items-center gap-2">
                          <InputNumber
                            v-model="product.productobonificacion_cantidad"
                            :min="1"
                            :maxFractionDigits="0"
                            :useGrouping="false"
                            inputClass="w-full text-center"
                            class="w-20"
                          />
                          <button
                            @click="validateAndUpdateBonificationQuantity(product)"
                            class="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            title="Guardar cantidad"
                          >
                            ✓
                          </button>
                        </div>
                      </td>
                      <td class="px-4 py-4 text-center">
                        <button
                          @click="unlinkBonification(product.producto_id, product.productoatributo_id)"
                          class="text-red-600 hover:text-red-900"
                          title="Eliminar producto"
                        >
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                    :model-value="isPromotionActive"
                    @update:model-value="handleToggleChange"
                    :disabled="isUpdatingStatus"
                  />
                </div>

                <!-- Status Display -->
                <div class="pt-3 border-t border-gray-200">
                  <span class="text-sm text-gray-500">Estado actual:</span>
                  <span
                    v-if="Number(currentPromotion.tiendapromocion_estado) === 1"
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
                    v-if="Number(currentPromotion.is_active_period) === 1"
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

    <!-- Link Bonifications Dialog -->
    <LinkBonificationsDialog
      v-if="Number(currentPromotion?.promocion_id) === 7"
      v-model:visible="showLinkBonificationsDialog"
      :promotion-id="currentPromotion?.tiendapromocion_id || null"
      @linked="handleBonificationsLinked"
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
import InputNumber from 'primevue/inputnumber'
import LinkProductsDialog from '@/components/promotions/LinkProductsDialog.vue'
import LinkBonificationsDialog from '@/components/promotions/LinkBonificationsDialog.vue'
import EditPromotionDialog from '@/components/promotions/EditPromotionDialog.vue'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'

const route = useRoute()
const router = useRouter()
const promotionsStore = usePromotionsStore()
const toast = useToast()

const { currentPromotion, promotionProducts, bonificationProducts, isLoading, error } = storeToRefs(promotionsStore)

// Dialogs
const showLinkProductsDialog = ref(false)
const showLinkBonificationsDialog = ref(false)
const showEditDialog = ref(false)

// Status toggle
const isUpdatingStatus = ref(false)
const isPromotionActive = computed(() => {
  // Convert to number because backend returns string
  const estado = Number(currentPromotion.value?.tiendapromocion_estado)
  const result = estado === 1
  console.log('isPromotionActive computed:', {
    estadoOriginal: currentPromotion.value?.tiendapromocion_estado,
    estadoConvertido: estado,
    result,
    promotion: currentPromotion.value?.tiendapromocion_nombre
  })
  return result
})

async function handleToggleChange(newValue: boolean) {
  if (!currentPromotion.value) {
    console.log('Ignoring toggle - no promotion loaded')
    return
  }

  if (isUpdatingStatus.value) {
    console.log('Ignoring toggle - already updating')
    return
  }

  // Convert to number for proper comparison
  const currentStatus = Number(currentPromotion.value.tiendapromocion_estado)
  const currentBoolValue = currentStatus === 1

  // If the new value is the same as current, ignore
  if (newValue === currentBoolValue) {
    console.log('Ignoring toggle - same value as current', { newValue, currentStatus, currentBoolValue })
    return
  }

  console.log('Toggle clicked! Changing from', currentBoolValue, 'to', newValue)

  try {
    isUpdatingStatus.value = true
    const newStatus = newValue ? 1 : 0

    console.log('Updating status from', currentStatus, 'to', newStatus)

    const result = await promotionsStore.modifyPromotion(currentPromotion.value.tiendapromocion_id, {
      tiendapromocion_estado: newStatus
    })

    console.log('API response:', result)

    // Refresh to get updated data
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
    console.log('Promotion refreshed successfully')
  } catch (error) {
    console.error('Error toggling status:', error)
    alert('Error al cambiar el estado de la promoción')
  } finally {
    isUpdatingStatus.value = false
  }
}

// Get image URL
function getImageUrl(imageName: string) {
  return `https://cdn.mitienda.pe/images/${imageName}`
}

// Format date
function formatDate(dateString: string) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
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
async function handleProductsLinked() {
  if (!currentPromotion.value) return
  await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
  toast.add({
    severity: 'success',
    summary: 'Productos Vinculados',
    detail: 'Los productos se vincularon correctamente',
    life: 2000
  })
}

// Handle bonifications linked
async function handleBonificationsLinked() {
  if (!currentPromotion.value) return
  await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
  toast.add({
    severity: 'success',
    summary: 'Bonificaciones Vinculadas',
    detail: 'Las bonificaciones se vincularon correctamente',
    life: 2000
  })
}

// Validate and update product quantity (triggered on blur)
async function validateAndUpdateProductQuantity(product: any) {
  if (!currentPromotion.value) return

  // Validación: cantidad no puede estar vacía o ser menor a 1
  const quantity = product.productopromocion_cantidadproducto

  if (!quantity || quantity < 1) {
    toast.add({
      severity: 'warn',
      summary: 'Cantidad Inválida',
      detail: 'La cantidad debe ser mayor o igual a 1',
      life: 3000
    })
    // Restaurar valor original
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
    return
  }

  // Check si la cantidad cambió realmente
  const originalProduct = promotionProducts.value.find(p => p.producto_id === product.producto_id)
  if (originalProduct && originalProduct.productopromocion_cantidadproducto === quantity) {
    return // No cambió, no hacer nada
  }

  try {
    await apiClient.put(`/promotions/${currentPromotion.value.tiendapromocion_id}/products/${product.producto_id}`, {
      cantidad: quantity
    })

    toast.add({
      severity: 'success',
      summary: 'Cantidad Actualizada',
      detail: 'La cantidad del producto se actualizó correctamente',
      life: 2000
    })

    // Refrescar para obtener datos actualizados
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
  } catch (error: any) {
    console.error('Error updating product quantity:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar la cantidad',
      life: 3000
    })
    // Reload to revert the change
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
  }
}

// Validate and update bonification quantity (triggered on blur)
async function validateAndUpdateBonificationQuantity(product: any) {
  if (!currentPromotion.value) return

  // Validación: cantidad no puede estar vacía o ser menor a 1
  const quantity = product.productobonificacion_cantidad

  if (!quantity || quantity < 1) {
    toast.add({
      severity: 'warn',
      summary: 'Cantidad Inválida',
      detail: 'La cantidad debe ser mayor o igual a 1',
      life: 3000
    })
    // Restaurar valor original
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
    return
  }

  // Check si la cantidad cambió realmente
  const originalProduct = bonificationProducts.value.find(
    p => p.producto_id === product.producto_id &&
         (p.productoatributo_id || 0) === (product.productoatributo_id || 0)
  )
  if (originalProduct && originalProduct.productobonificacion_cantidad === quantity) {
    return // No cambió, no hacer nada
  }

  try {
    await apiClient.put(`/promotions/${currentPromotion.value.tiendapromocion_id}/bonifications/${product.producto_id}`, {
      cantidad: quantity,
      atributo_id: product.productoatributo_id || null
    })

    toast.add({
      severity: 'success',
      summary: 'Cantidad Actualizada',
      detail: 'La cantidad del producto de bonificación se actualizó correctamente',
      life: 2000
    })

    // Refrescar para obtener datos actualizados
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
  } catch (error: any) {
    console.error('Error updating bonification quantity:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar la cantidad',
      life: 3000
    })
    // Reload to revert the change
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)
  }
}

// Unlink product
async function unlinkProduct(productId: number) {
  if (!currentPromotion.value) return
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return

  try {
    await apiClient.delete(`/promotions/${currentPromotion.value.tiendapromocion_id}/products/${productId}`)
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)

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

// Unlink bonification
async function unlinkBonification(productId: number, attributeId: number | undefined) {
  if (!currentPromotion.value) return
  if (!confirm('¿Estás seguro de que deseas eliminar este producto de bonificación?')) return

  try {
    await apiClient.delete(`/promotions/${currentPromotion.value.tiendapromocion_id}/bonifications/${productId}`, {
      data: { atributo_id: attributeId || null }
    })
    await promotionsStore.fetchPromotion(currentPromotion.value.tiendapromocion_id)

    toast.add({
      severity: 'success',
      summary: 'Producto Eliminado',
      detail: 'El producto de bonificación se eliminó correctamente',
      life: 2000
    })
  } catch (error: any) {
    console.error('Error unlinking bonification:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar el producto',
      life: 3000
    })
  }
}

// Ensure quantities are set correctly when loading products
function ensureQuantitiesAreSet() {
  // Ensure product quantities are at least 1 and convert to number
  promotionProducts.value.forEach(product => {
    const cantidad = Number(product.productopromocion_cantidadproducto)
    product.productopromocion_cantidadproducto = cantidad && cantidad >= 1 ? cantidad : 1
  })

  // Ensure bonification quantities are at least 1 and convert to number
  bonificationProducts.value.forEach(product => {
    const cantidad = Number(product.productobonificacion_cantidad)
    product.productobonificacion_cantidad = cantidad && cantidad >= 1 ? cantidad : 1
  })
}

// Initialize
onMounted(async () => {
  const promotionId = parseInt(route.params.id as string)
  if (promotionId) {
    await promotionsStore.fetchPromotion(promotionId)
    ensureQuantitiesAreSet()
  }
})
</script>

<style scoped>
/* Customize InputNumber */
:deep(.p-inputnumber) {
  width: 5rem;
}

:deep(.p-inputnumber-input) {
  text-align: center;
  padding: 0.5rem;
}
</style>
