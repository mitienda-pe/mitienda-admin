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
      <h1 class="text-2xl font-bold text-gray-900">Configurar Bonificación</h1>
      <p v-if="currentPromotion" class="mt-1 text-sm text-gray-500">
        {{ currentPromotion.tiendapromocion_nombre }}
      </p>
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
      <!-- Configuración de Activación -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-4 py-5 sm:p-6">
          <div class="mb-4">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Configuración de Activación</h3>
            <p class="text-sm text-gray-500 mt-1">Define cómo se activa la bonificación</p>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                 :class="{ 'border-blue-500 bg-blue-50': bonFormaGrupos === 0 }"
                 @click="updateBonFormaGrupos(0)">
              <input
                type="radio"
                :checked="bonFormaGrupos === 0"
                class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                @change="updateBonFormaGrupos(0)"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-900">Cualquier producto activador (OR)</div>
                <div class="text-sm text-gray-600 mt-1">La bonificación se activa si el cliente compra <strong>al menos UNO</strong> de los productos activadores listados abajo</div>
              </div>
            </div>

            <div class="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                 :class="{ 'border-blue-500 bg-blue-50': bonFormaGrupos === 1 }"
                 @click="updateBonFormaGrupos(1)">
              <input
                type="radio"
                :checked="bonFormaGrupos === 1"
                class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                @change="updateBonFormaGrupos(1)"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-900">Todos los productos activadores (AND)</div>
                <div class="text-sm text-gray-600 mt-1">La bonificación se activa solo si el cliente compra <strong>TODOS</strong> los productos activadores listados abajo</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Productos Base Card -->
      <div class="bg-white shadow overflow-hidden rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-medium leading-6 text-gray-900">Productos Base</h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ baseProducts.length }} producto(s) vinculado(s) a esta bonificación
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
          <div v-if="baseProducts.length > 0" class="overflow-x-auto">
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
                <tr v-for="product in baseProducts" :key="product.producto_id">
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
                  <td class="px-4 py-4">
                    <InputNumber
                      v-model="product.productopromocion_cantidadproducto"
                      :min="1"
                      :maxFractionDigits="0"
                      @update:modelValue="updateProductQuantity(product.producto_id, $event)"
                      class="w-20"
                      inputClass="w-full"
                    />
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
            No hay productos base vinculados
          </div>
        </div>
      </div>

      <!-- Productos de Bonificación Card -->
      <div class="bg-white shadow overflow-hidden rounded-lg">
        <div class="px-4 py-5 sm:p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-medium leading-6 text-gray-900">Productos de Bonificación</h3>
              <p class="text-sm text-gray-500 mt-1">
                {{ bonificationProducts.length }} producto(s) que se bonifican en esta promoción
              </p>
            </div>
            <Button
              label="Vincular Bonificaciones"
              icon="pi pi-plus"
              @click="showLinkBonificationsDialog = true"
              severity="success"
            />
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
                  <td class="px-4 py-4">
                    <InputNumber
                      v-model="product.productobonificacion_cantidad"
                      :min="1"
                      :maxFractionDigits="0"
                      @update:modelValue="updateBonificationQuantity(product.producto_id, product.productoatributo_id, $event)"
                      class="w-20"
                      inputClass="w-full"
                    />
                  </td>
                  <td class="px-4 py-4 text-center">
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      @click="unlinkBonification(product.producto_id, product.productoatributo_id)"
                      v-tooltip.left="'Eliminar producto'"
                    />
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

      <!-- Help Section -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="flex gap-3">
          <i class="pi pi-info-circle text-blue-600 text-xl flex-shrink-0"></i>
          <div>
            <h4 class="text-sm font-semibold text-blue-900 mb-1">¿Cómo funciona?</h4>
            <ul class="text-sm text-blue-800 space-y-1">
              <li><strong>Productos Base:</strong> Los productos que el cliente debe comprar para activar la bonificación.</li>
              <li><strong>Productos de Bonificación:</strong> Los productos que se regalan como bonificación.</li>
              <li><strong>Cantidad:</strong> Edita la cantidad directamente en la tabla para cada producto.</li>
              <li><strong>Ejemplo:</strong> Si el cliente compra 12 productos base, recibe 1 producto de bonificación gratis.</li>
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

    <!-- Link Bonifications Dialog -->
    <LinkBonificationsDialog
      v-model:visible="showLinkBonificationsDialog"
      :promotion-id="promotionId"
      @linked="handleBonificationsLinked"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePromotionsStore } from '@/stores/promotions.store'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import InputNumber from 'primevue/inputnumber'
import LinkProductsDialog from '@/components/promotions/LinkProductsDialog.vue'
import LinkBonificationsDialog from '@/components/promotions/LinkBonificationsDialog.vue'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'

const route = useRoute()
const toast = useToast()
const promotionsStore = usePromotionsStore()

const { currentPromotion, isLoading } = storeToRefs(promotionsStore)

const promotionId = computed(() => parseInt(route.params.id as string))

// Local state for products with quantities
const baseProducts = ref<any[]>([])
const bonificationProducts = ref<any[]>([])

// Local state for bonFormaGrupos
const bonFormaGrupos = ref<number>(0)

// Dialog visibility
const showLinkProductsDialog = ref(false)
const showLinkBonificationsDialog = ref(false)

// Get image URL
function getImageUrl(imageName: string) {
  const cdnUrl = import.meta.env.VITE_CDN_URL || 'https://cdn.mitienda.pe'
  return `${cdnUrl}/images/${imageName}`
}

// Fetch products from backend
async function fetchProducts() {
  try {
    const [productsResponse, bonificationsResponse] = await Promise.all([
      apiClient.get(`/promotions/${promotionId.value}/products`),
      apiClient.get(`/promotions/${promotionId.value}/bonifications`)
    ])

    if (productsResponse.data.status === 'success') {
      baseProducts.value = productsResponse.data.data.map((p: any) => ({
        ...p,
        productopromocion_cantidadproducto: p.productopromocion_cantidadproducto || 1
      }))
    }

    if (bonificationsResponse.data.status === 'success') {
      bonificationProducts.value = bonificationsResponse.data.data.map((p: any) => ({
        ...p,
        productobonificacion_cantidad: p.productobonificacion_cantidad || 1
      }))
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

// Update product quantity
async function updateProductQuantity(productId: number, quantity: number | null) {
  if (!quantity || quantity < 1) return

  try {
    await apiClient.put(`/promotions/${promotionId.value}/products/${productId}`, {
      cantidad: quantity
    })

    toast.add({
      severity: 'success',
      summary: 'Cantidad Actualizada',
      detail: 'La cantidad del producto se actualizó correctamente',
      life: 2000
    })
  } catch (error: any) {
    console.error('Error updating product quantity:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar la cantidad',
      life: 3000
    })
    // Reload to revert the change
    await fetchProducts()
  }
}

// Update bonification quantity
async function updateBonificationQuantity(productId: number, attributeId: number | undefined, quantity: number | null) {
  if (!quantity || quantity < 1) return

  try {
    await apiClient.put(`/promotions/${promotionId.value}/bonifications/${productId}`, {
      cantidad: quantity,
      atributo_id: attributeId || null
    })

    toast.add({
      severity: 'success',
      summary: 'Cantidad Actualizada',
      detail: 'La cantidad del producto de bonificación se actualizó correctamente',
      life: 2000
    })
  } catch (error: any) {
    console.error('Error updating bonification quantity:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar la cantidad',
      life: 3000
    })
    // Reload to revert the change
    await fetchProducts()
  }
}

// Unlink product
async function unlinkProduct(productId: number) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return

  try {
    await apiClient.delete(`/promotions/${promotionId.value}/products/${productId}`)

    baseProducts.value = baseProducts.value.filter(p => p.producto_id !== productId)

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
  if (!confirm('¿Estás seguro de que deseas eliminar este producto de bonificación?')) return

  try {
    await apiClient.delete(`/promotions/${promotionId.value}/bonifications/${productId}`, {
      data: { atributo_id: attributeId || null }
    })

    bonificationProducts.value = bonificationProducts.value.filter(p =>
      !(p.producto_id === productId && p.productoatributo_id === attributeId)
    )

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

// Update bonFormaGrupos
async function updateBonFormaGrupos(value: number) {
  if (bonFormaGrupos.value === value) return

  try {
    await promotionsStore.modifyPromotion(promotionId.value, {
      tiendapromocion_bon_formagrupos: value
    })

    bonFormaGrupos.value = value

    toast.add({
      severity: 'success',
      summary: 'Configuración Actualizada',
      detail: value === 0
        ? 'La bonificación se activará con cualquier producto activador'
        : 'La bonificación se activará solo con todos los productos activadores',
      life: 3000
    })
  } catch (error: any) {
    console.error('Error updating bonFormaGrupos:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al actualizar la configuración',
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
    detail: 'Los productos se vinculados correctamente',
    life: 2000
  })
}

// Handle bonifications linked
async function handleBonificationsLinked() {
  await fetchProducts()
  toast.add({
    severity: 'success',
    summary: 'Bonificaciones Vinculadas',
    detail: 'Las bonificaciones se vincularon correctamente',
    life: 2000
  })
}

// Initialize
onMounted(async () => {
  if (promotionId.value) {
    await promotionsStore.fetchPromotion(promotionId.value)
    await fetchProducts()

    // Initialize bonFormaGrupos from current promotion
    if (currentPromotion.value) {
      bonFormaGrupos.value = currentPromotion.value.tiendapromocion_bon_formagrupos ?? 0
    }
  }
})
</script>

<style scoped>
/* Customize InputNumber width */
:deep(.p-inputnumber) {
  width: 5rem;
}

:deep(.p-inputnumber-input) {
  width: 100%;
  text-align: center;
}
</style>
