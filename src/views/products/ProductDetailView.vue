<template>
  <div>
    <!-- Breadcrumb -->
    <div class="mb-4 flex items-center justify-between">
      <Button
        label="Volver a productos"
        icon="pi pi-arrow-left"
        text
        @click="router.push('/products')"
      />
      <div v-if="product">
        <Button
          label="Editar"
          icon="pi pi-pencil"
          @click="showEditDialog = true"
        />
      </div>
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
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Columna Izquierda: Información del producto -->
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
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    product.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  ]"
                >
                  {{ product.published ? 'Publicado' : 'No publicado' }}
                </span>
                <span
                  v-if="product.featured"
                  class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  Destacado
                </span>
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    stockBadgeClass
                  ]"
                >
                  {{ stockLabel }}
                </span>
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
              <div v-if="product.description_html || product.description">
                <h3 class="font-semibold text-secondary mb-2">Descripción</h3>
                <div v-if="product.description_html" class="text-secondary-600 prose prose-sm max-w-none" v-html="product.description_html"></div>
                <p v-else class="text-secondary-600">{{ product.description }}</p>
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

        <!-- Dimensiones y Peso -->
        <Card>
          <template #title>
            <span class="text-lg">Dimensiones y Peso</span>
          </template>
          <template #content>
            <div class="space-y-3">
              <!-- Dimensiones -->
              <div v-if="product.height != null || product.width != null || product.length != null">
                <h4 class="text-sm font-semibold text-secondary-700 mb-2">Dimensiones</h4>
                <div class="grid grid-cols-3 gap-3">
                  <div v-if="product.height != null" class="text-center p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-secondary-600 mb-1">Altura</div>
                    <div class="font-medium">{{ product.height }} {{ product.dimensions_unit || 'cm' }}</div>
                  </div>
                  <div v-if="product.width != null" class="text-center p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-secondary-600 mb-1">Ancho</div>
                    <div class="font-medium">{{ product.width }} {{ product.dimensions_unit || 'cm' }}</div>
                  </div>
                  <div v-if="product.length != null" class="text-center p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-secondary-600 mb-1">Largo</div>
                    <div class="font-medium">{{ product.length }} {{ product.dimensions_unit || 'cm' }}</div>
                  </div>
                </div>
              </div>

              <Divider v-if="(product.height != null || product.width != null || product.length != null) && (product.weight != null || displayVolumetricWeight)" />

              <!-- Peso -->
              <div v-if="product.weight != null || displayVolumetricWeight">
                <h4 class="text-sm font-semibold text-secondary-700 mb-2">Peso</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div v-if="product.weight != null" class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span class="text-secondary-600">Peso:</span>
                    <span class="font-medium">{{ product.weight }} {{ product.weight_unit || 'kg' }}</span>
                  </div>
                  <div v-if="displayVolumetricWeight" class="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span class="text-secondary-600">Peso volumétrico:</span>
                    <span class="font-medium">{{ displayVolumetricWeight.toFixed(2) }} {{ product.weight_unit || 'kg' }}</span>
                  </div>
                </div>
              </div>

              <!-- Mensaje cuando no hay datos -->
              <div v-if="product.height == null && product.width == null && product.length == null && product.weight == null && !product.volumetric_weight" class="text-center py-4 text-gray-500">
                <i class="pi pi-box text-3xl mb-2 block"></i>
                <p class="text-sm">No se han registrado dimensiones ni peso</p>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Columna Derecha: Fotos, Video y Documentos -->
      <div class="space-y-6">
        <!-- Galería de imágenes -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-images"></i>
              Imágenes
            </div>
          </template>
          <template #content>
            <!-- Grid de imágenes -->
            <div v-if="product.images && product.images.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div
                v-for="(image, index) in product.images"
                :key="index"
                class="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-colors"
              >
                <img
                  :src="image.url"
                  :alt="`${product.name} - imagen ${index + 1}`"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
            <!-- Sin imágenes -->
            <div v-else class="w-full h-96 bg-gray-100 flex items-center justify-center rounded-lg">
              <img :src="placeholderImage" alt="Sin imagen" class="w-full h-full object-contain opacity-50" />
            </div>
          </template>
        </Card>

        <!-- Video del producto -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-video"></i>
                Video
              </div>
              <Button
                v-if="!hasVideo"
                label="Añadir Video"
                icon="pi pi-plus"
                size="small"
                @click="showVideoUploader = true"
              />
            </div>
          </template>
          <template #content>
            <ProductVideoPlayer
              v-if="hasVideo"
              :video="product.video || null"
              :product-id="product.id"
              @delete="handleVideoDelete"
              @refresh="handleVideoRefresh"
            />
            <div v-else class="text-center py-8 text-gray-500">
              <i class="pi pi-video text-4xl mb-3 block"></i>
              <p>No hay video disponible</p>
            </div>
          </template>
        </Card>

        <!-- Documentos del producto -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-file-pdf"></i>
                Documentos
                <span class="text-sm text-gray-600 font-normal">
                  ({{ product.documents?.length || 0 }}/3)
                </span>
              </div>
              <Button
                v-if="(product.documents?.length || 0) < 3"
                label="Agregar Documento"
                icon="pi pi-plus"
                size="small"
                @click="showDocumentUploader = true"
              />
            </div>
          </template>
          <template #content>
            <ProductDocumentList
              :product-id="product.id"
              :documents="product.documents || []"
              @delete-success="handleDocumentDelete"
              @delete-error="handleDocumentError"
            />
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

    <!-- Modal de edición rápida -->
    <ProductQuickEditDialog
      v-model:visible="showEditDialog"
      :product="product"
      @save="handleSaveProduct"
    />

    <!-- Modal de subida de video -->
    <ProductVideoUploader
      v-if="product"
      v-model:visible="showVideoUploader"
      :product-id="product.id"
      @upload-success="handleVideoUploadSuccess"
      @upload-error="handleVideoUploadError"
    />

    <!-- Modal de subida de documentos -->
    <ProductDocumentUploader
      v-if="product"
      v-model:visible="showDocumentUploader"
      :product-id="product.id"
      @upload-success="handleDocumentUpload"
      @upload-error="handleDocumentError"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import ProductQuickEditDialog from '@/components/products/ProductQuickEditDialog.vue'
import ProductVideoUploader from '@/components/products/ProductVideoUploader.vue'
import ProductVideoPlayer from '@/components/products/ProductVideoPlayer.vue'
import ProductDocumentUploader from '@/components/products/ProductDocumentUploader.vue'
import ProductDocumentList from '@/components/products/ProductDocumentList.vue'
import type { ProductQuickEditData } from '@/components/products/ProductQuickEditDialog.vue'
import placeholderImage from '@/assets/images/landscape-placeholder-svgrepo-com.svg'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

const product = computed(() => productsStore.currentProduct)
const showEditDialog = ref(false)
const showVideoUploader = ref(false)
const showDocumentUploader = ref(false)

// Computed para forzar reactividad del video
const hasVideo = computed(() => {
  return !!(product.value?.video?.cloudflare_uid)
})

const stockLabel = computed(() => {
  if (!product.value) return ''
  if (product.value.stock === 0) return 'Agotado'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'Stock bajo'
  }
  return 'En stock'
})

const stockBadgeClass = computed(() => {
  if (!product.value) return 'bg-red-100 text-red-800'
  if (product.value.stock === 0) return 'bg-red-100 text-red-800'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'bg-yellow-100 text-yellow-800'
  }
  return 'bg-green-100 text-green-800'
})

const stockColorClass = computed(() => {
  if (!product.value) return 'text-red-600'
  if (product.value.stock === 0) return 'text-red-600'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'text-orange-600'
  }
  return 'text-green-600'
})

// Calcular peso volumétrico si no está disponible
// Fórmula: (Alto x Ancho x Largo) / 5000 (factor de conversión estándar)
const calculatedVolumetricWeight = computed(() => {
  if (!product.value) return null

  const { height, width, length, dimensions_unit } = product.value

  // Necesitamos las 3 dimensiones para calcular
  if (!height || !width || !length) return null

  // Convertir a cm si es necesario
  let h = height
  let w = width
  let l = length

  if (dimensions_unit === 'm') {
    h *= 100
    w *= 100
    l *= 100
  }

  // Calcular peso volumétrico: (alto x ancho x largo) / 5000
  const volumetricWeight = (h * w * l) / 5000

  return volumetricWeight
})

const displayVolumetricWeight = computed(() => {
  if (!product.value) return null

  // Si ya tiene peso volumétrico guardado, usar ese
  if (product.value.volumetric_weight) {
    return product.value.volumetric_weight
  }

  // Si no, usar el calculado
  return calculatedVolumetricWeight.value
})

const handleSaveProduct = async (data: ProductQuickEditData) => {
  if (!product.value) return

  const result = await productsStore.updateProduct(product.value.id, data)

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Producto actualizado',
      detail: 'Los cambios se guardaron correctamente',
      life: 3000
    })
    showEditDialog.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: productsStore.error || 'No se pudo actualizar el producto',
      life: 3000
    })
  }
}

const handleVideoUploadSuccess = async () => {
  toast.add({
    severity: 'success',
    summary: 'Video en proceso',
    detail: 'El video se está procesando. Esto puede tomar unos minutos.',
    life: 5000
  })
  showVideoUploader.value = false

  // Refrescar producto para obtener el estado actualizado
  if (product.value) {
    await productsStore.fetchProduct(product.value.id)
  }
}

const handleVideoUploadError = (error: any) => {
  toast.add({
    severity: 'error',
    summary: 'Error al subir video',
    detail: error.message || 'No se pudo subir el video. Por favor, intenta nuevamente.',
    life: 5000
  })
}

const handleVideoDelete = async () => {
  toast.add({
    severity: 'success',
    summary: 'Video eliminado',
    detail: 'El video ha sido eliminado correctamente',
    life: 3000
  })

  // Refresh product to update video status
  const productId = Number(route.params.id)
  if (productId) {
    await productsStore.fetchProduct(productId)
  }
}

const handleVideoRefresh = async () => {
  // Refresh product to check video processing status
  const productId = Number(route.params.id)
  if (productId) {
    await productsStore.fetchProduct(productId)
  }
}

const handleDocumentUpload = async () => {
  toast.add({
    severity: 'success',
    summary: 'Documento subido',
    detail: 'El documento se ha subido correctamente',
    life: 3000
  })

  // Refresh product to update documents list
  if (product.value) {
    await productsStore.fetchProduct(product.value.id)
  }
}

const handleDocumentDelete = async () => {
  toast.add({
    severity: 'success',
    summary: 'Documento eliminado',
    detail: 'El documento ha sido eliminado correctamente',
    life: 3000
  })

  // Refresh product to update documents list
  if (product.value) {
    await productsStore.fetchProduct(product.value.id)
  }
}

const handleDocumentError = (error: string) => {
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: error || 'Ocurrió un error con el documento',
    life: 5000
  })
}

onMounted(async () => {
  const productId = Number(route.params.id)
  if (productId) {
    await productsStore.fetchProduct(productId)

    // DEBUG: Log dimensions data
    console.log('🔍 PRODUCT DEBUG:', {
      height: product.value?.height,
      width: product.value?.width,
      length: product.value?.length,
      weight: product.value?.weight,
      dimensions_unit: product.value?.dimensions_unit,
      weight_unit: product.value?.weight_unit,
      full_product: product.value
    })
  }
})
</script>
