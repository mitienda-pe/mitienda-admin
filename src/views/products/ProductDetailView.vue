<template>
  <div>
    <!-- Breadcrumb -->
    <div class="mb-4 flex items-center justify-between">
      <Button label="Volver a productos" icon="pi pi-arrow-left" text @click="router.push('/products')" />
      <div v-if="product" class="flex gap-2">
        <Button v-if="storeUrl && product.seo?.slug" label="Ver en tienda" icon="pi pi-external-link"
          severity="secondary" outlined @click="openProductInStore" />
        <Button label="Editar" icon="pi pi-pencil" @click="showEditDialog = true" />
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
        <!-- Información Adicional -->
        <Card>
          <template #title>
            <span class="text-lg">Información Adicional</span>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Nombre, SKU y Barcode -->
              <div>
                <h1 class="text-3xl font-bold text-secondary mb-2">{{ product.name }}</h1>
                <div class="space-y-1">
                  <p class="text-secondary-500">
                    <span class="font-medium">SKU:</span> {{ product.sku }}
                  </p>
                  <p v-if="product.barcode" class="text-secondary-500">
                    <span class="font-medium">Código de barras:</span>
                    <span class="font-mono bg-gray-50 px-2 py-0.5 rounded">{{ product.barcode }}</span>
                  </p>
                </div>
              </div>

              <!-- Badges -->
              <div class="flex gap-2">
                <span :class="[
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  product.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                ]">
                  {{ product.published ? 'Publicado' : 'No publicado' }}
                </span>
                <span v-if="product.featured"
                  class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Destacado
                </span>
                <span :class="[
                  'px-2.5 py-1 rounded-full text-xs font-medium',
                  stockBadgeClass
                ]">
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

              <!-- Separador -->
              <div class="border-t border-gray-200 my-4"></div>

              <!-- Creado -->
              <div>
                <span class="text-secondary-600">Creado: </span>
                <span class="font-medium">{{ formatDate(product.created_at) }}</span>
              </div>

              <!-- Actualizado -->
              <div>
                <span class="text-secondary-600">Actualizado: </span>
                <span class="font-medium">{{ formatDate(product.updated_at) }}</span>
              </div>

              <!-- Stock -->
              <div>
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <span class="text-secondary-600">Stock: </span>
                    <span class="font-medium" :class="stockColorClass">
                      {{ product.unlimited_stock ? 'Ilimitado' : `${product.stock} unidades` }}
                    </span>
                    <span v-if="netsuiteStock !== null" class="text-xs text-gray-500 ml-2">
                      (NetSuite: {{ netsuiteStock }} unidades)
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <Button
                      icon="pi pi-search"
                      label="Consultar"
                      size="small"
                      severity="info"
                      outlined
                      @click="queryNetsuiteStock"
                      :disabled="product.unlimited_stock"
                      v-tooltip.top="'Consultar stock en NetSuite'"
                    />
                    <Button
                      icon="pi pi-sync"
                      label="Sincronizar"
                      size="small"
                      severity="success"
                      outlined
                      :loading="isSyncingStock"
                      @click="syncStockWithNetsuite"
                      :disabled="product.unlimited_stock"
                      v-tooltip.top="'Sincronizar stock desde NetSuite'"
                    />
                  </div>
                </div>
              </div>

              <!-- Stock mínimo -->
              <div v-if="product.min_stock">
                <span class="text-secondary-600">Stock mínimo: </span>
                <span class="font-medium">{{ product.min_stock }} unidades</span>
              </div>

              <!-- Orden en catálogo -->
              <div v-if="product.order != null">
                <span class="text-secondary-600">Orden: </span>
                <span class="font-medium">{{ product.order }}</span>
              </div>

              <!-- Marca -->
              <div v-if="product.brand">
                <span class="text-secondary-600">Marca: </span>
                <span class="font-medium">{{ product.brand.name }}</span>
              </div>

              <!-- Categorías -->
              <div v-if="product.categories && product.categories.length > 0">
                <div class="mb-1">
                  <span class="text-secondary-600">{{ product.categories.length > 1 ? 'Categorías: ' : 'Categoría: ' }}</span>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="category in product.categories"
                    :key="category.id"
                    class="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 text-sm rounded"
                  >
                    {{ category.name }}
                  </span>
                </div>
              </div>

              <!-- Categorías Externas -->
              <div v-if="product.external_categories && hasExternalCategories" class="space-y-2">
                <h4 class="text-sm font-semibold text-secondary-700">Categorías Externas</h4>

                <div v-if="product.external_categories.facebook" class="flex items-start gap-2">
                  <i class="pi pi-facebook text-blue-600 mt-0.5"></i>
                  <span class="text-sm text-secondary-600">
                    <span class="font-semibold">Facebook: </span>{{ product.external_categories.facebook.id }} > {{ product.external_categories.facebook.name }}
                  </span>
                </div>

                <div v-if="product.external_categories.google" class="flex items-start gap-2">
                  <i class="pi pi-google text-red-600 mt-0.5"></i>
                  <span class="text-sm text-secondary-600">
                    <span class="font-semibold">Google: </span>{{ product.external_categories.google.id }} > {{ product.external_categories.google.name }}
                  </span>
                </div>

                <div v-if="product.external_categories.mercadolibre" class="flex items-start gap-2">
                  <i class="pi pi-shopping-cart text-yellow-500 mt-0.5"></i>
                  <span class="text-sm text-secondary-600">
                    <span class="font-semibold">MercadoLibre: </span>{{ product.external_categories.mercadolibre.id }} > {{ product.external_categories.mercadolibre.name }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Descripción -->
        <Card v-if="product.description_html || product.description">
          <template #title>
            <div class="flex items-center justify-between w-full">
              <span class="text-lg">Descripción</span>
              <div class="flex gap-2">
                <Button label="Editar Texto" icon="pi pi-file-edit" size="small" severity="secondary" outlined
                  @click="openDescriptionEditor('wysiwyg')" />
                <Button label="Editar Código" icon="pi pi-code" size="small" severity="secondary" outlined
                  @click="openDescriptionEditor('code')" />
              </div>
            </div>
          </template>
          <template #content>
            <div v-if="product.description_html" class="text-secondary-600 prose prose-sm max-w-none"
              v-html="product.description_html"></div>
            <p v-else class="text-secondary-600">{{ product.description }}</p>
          </template>
        </Card>

        <!-- SEO -->
        <Card>
          <template #title>
            <span class="text-lg">SEO</span>
          </template>
          <template #content>
            <div class="space-y-3">
              <!-- Meta Title -->
              <div v-if="product.seo?.meta_title">
                <label class="text-sm font-medium text-secondary-700">Meta Title</label>
                <p class="text-secondary-600 mt-1">{{ product.seo.meta_title }}</p>
              </div>

              <!-- Meta Description -->
              <div v-if="product.seo?.meta_description">
                <label class="text-sm font-medium text-secondary-700">Meta Description</label>
                <p class="text-secondary-600 mt-1">{{ product.seo.meta_description }}</p>
              </div>

              <!-- Slug -->
              <div v-if="product.seo?.slug">
                <label class="text-sm font-medium text-secondary-700">Slug (URL)</label>
                <p class="text-secondary-600 mt-1 font-mono text-sm bg-gray-50 p-2 rounded">{{ product.seo.slug }}</p>
              </div>

              <!-- Meta Image -->
              <div v-if="product.seo?.meta_image">
                <label class="text-sm font-medium text-secondary-700">Meta Image</label>
                <img :src="product.seo.meta_image" alt="Meta Image" class="mt-2 max-w-xs rounded border" />
              </div>

              <!-- Mensaje cuando no hay datos SEO -->
              <div
                v-if="!product.seo || (!product.seo.meta_title && !product.seo.meta_description && !product.seo.slug)"
                class="text-center py-4 text-gray-500">
                <i class="pi pi-search text-3xl mb-2 block"></i>
                <p class="text-sm">No se ha configurado información SEO</p>
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

              <Divider
                v-if="(product.height != null || product.width != null || product.length != null) && (product.weight != null || displayVolumetricWeight)" />

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
                    <span class="font-medium">{{ displayVolumetricWeight.toFixed(2) }}
                      {{ product.weight_unit || 'kg' }}</span>
                  </div>
                </div>
              </div>

              <!-- Mensaje cuando no hay datos -->
              <div
                v-if="product.height == null && product.width == null && product.length == null && product.weight == null && !product.volumetric_weight"
                class="text-center py-4 text-gray-500">
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
        <ProductImageGallery
          v-if="product"
          :images="product.images"
          :product-id="product.id"
          :product-name="product.name"
          @add-image="showImageUploader = true"
          @delete-image="handleImageDelete"
        />

        <!-- Video del producto -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-video"></i>
                Video
              </div>
              <Button v-if="!hasVideo" label="Añadir Video" icon="pi pi-plus" size="small"
                @click="showVideoUploader = true" />
            </div>
          </template>
          <template #content>
            <ProductVideoPlayer v-if="hasVideo" :video="product.video || null" :product-id="product.id"
              @delete="handleVideoDelete" @refresh="handleVideoRefresh" />
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
              <Button v-if="(product.documents?.length || 0) < 3" label="Agregar Documento" icon="pi pi-plus"
                size="small" @click="showDocumentUploader = true" />
            </div>
          </template>
          <template #content>
            <ProductDocumentList :product-id="product.id" :documents="product.documents || []"
              @delete-success="handleDocumentDelete" @delete-error="handleDocumentError" />
          </template>
        </Card>

        <!-- Etiquetas del producto -->
        <ProductTagAssignment v-if="product" :product-id="product.id" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-box text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">Producto no encontrado</h3>
      <Button label="Volver a productos" @click="router.push('/products')" />
    </div>

    <!-- Modal de edición rápida -->
    <ProductQuickEditDialog v-model:visible="showEditDialog" :product="product" @save="handleSaveProduct" />

    <!-- Modal de subida de imagen -->
    <ProductImageUploader v-if="product" v-model:visible="showImageUploader" :product-id="product.id"
      @upload-success="handleImageUploadSuccess" @upload-error="handleImageUploadError" />

    <!-- Modal de subida de video -->
    <ProductVideoUploader v-if="product" v-model:visible="showVideoUploader" :product-id="product.id"
      @upload-success="handleVideoUploadSuccess" @upload-error="handleVideoUploadError" />

    <!-- Modal de subida de documentos -->
    <ProductDocumentUploader v-if="product" v-model:visible="showDocumentUploader" :product-id="product.id"
      @upload-success="handleDocumentUpload" @upload-error="handleDocumentError" />

    <!-- Modal de edición de descripción -->
    <ProductDescriptionEditor v-if="product" v-model="showDescriptionEditor"
      :content="product.description_html || product.description || ''" :mode="editorMode"
      @save="handleSaveDescription" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductsStore } from '@/stores/products.store'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import ProductQuickEditDialog from '@/components/products/ProductQuickEditDialog.vue'
import ProductImageGallery from '@/components/products/ProductImageGallery.vue'
import ProductImageUploader from '@/components/products/ProductImageUploader.vue'
import ProductVideoUploader from '@/components/products/ProductVideoUploader.vue'
import ProductVideoPlayer from '@/components/products/ProductVideoPlayer.vue'
import ProductDocumentUploader from '@/components/products/ProductDocumentUploader.vue'
import ProductDocumentList from '@/components/products/ProductDocumentList.vue'
import ProductDescriptionEditor from '@/components/products/ProductDescriptionEditor.vue'
import ProductTagAssignment from '@/components/ProductTagAssignment.vue'
import type { ProductQuickEditData } from '@/components/products/ProductQuickEditDialog.vue'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const authStore = useAuthStore()
const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

const product = computed(() => productsStore.currentProduct)
const showEditDialog = ref(false)
const showImageUploader = ref(false)
const showVideoUploader = ref(false)
const showDocumentUploader = ref(false)
const showDescriptionEditor = ref(false)
const editorMode = ref<'wysiwyg' | 'code'>('wysiwyg')
const isSyncingStock = ref(false)
const netsuiteStock = ref<number | null>(null)

// Computed para forzar reactividad del video
const hasVideo = computed(() => {
  return !!(product.value?.video?.cloudflare_uid)
})

const stockLabel = computed(() => {
  if (!product.value) return ''

  // Si tiene stock ilimitado
  if (product.value.unlimited_stock) {
    return 'Stock ilimitado'
  }

  if (product.value.stock === 0) return 'Agotado'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'Stock bajo'
  }
  return 'En stock'
})

const stockBadgeClass = computed(() => {
  if (!product.value) return 'bg-red-100 text-red-800'

  // Si tiene stock ilimitado, mostrar en verde
  if (product.value.unlimited_stock) {
    return 'bg-green-100 text-green-800'
  }

  if (product.value.stock === 0) return 'bg-red-100 text-red-800'
  if (product.value.min_stock && product.value.stock <= product.value.min_stock) {
    return 'bg-yellow-100 text-yellow-800'
  }
  return 'bg-green-100 text-green-800'
})

const stockColorClass = computed(() => {
  if (!product.value) return 'text-red-600'

  // Si tiene stock ilimitado, mostrar en verde
  if (product.value.unlimited_stock) {
    return 'text-green-600'
  }

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

// Check if product has any external categories
const hasExternalCategories = computed(() => {
  if (!product.value?.external_categories) return false
  const { facebook, google, mercadolibre } = product.value.external_categories
  return !!(facebook || google || mercadolibre)
})

// URL de la tienda para el link "Ver en tienda"
const storeUrl = computed(() => {
  return authStore.selectedStore?.url || null
})

// Función para abrir el producto en la tienda virtual
const openProductInStore = () => {
  if (storeUrl.value && product.value?.seo?.slug) {
    // Asegurar que storeUrl termine con slash
    const baseUrl = storeUrl.value.endsWith('/') ? storeUrl.value : `${storeUrl.value}/`
    const productUrl = `${baseUrl}producto/${product.value.seo.slug}`
    window.open(productUrl, '_blank')
  }
}

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

const openDescriptionEditor = (mode: 'wysiwyg' | 'code') => {
  editorMode.value = mode
  showDescriptionEditor.value = true
}

const handleSaveDescription = async (content: string) => {
  if (!product.value) return

  const result = await productsStore.updateProduct(product.value.id, {
    description_html: content
  })

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Descripción actualizada',
      detail: 'Los cambios se han guardado correctamente',
      life: 3000
    })
    // Refresh product data
    await productsStore.fetchProduct(product.value.id)
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: productsStore.error || 'No se pudo actualizar la descripción',
      life: 3000
    })
  }
}

const handleImageUploadSuccess = async () => {
  toast.add({
    severity: 'success',
    summary: 'Imagen subida',
    detail: 'La imagen se ha subido correctamente',
    life: 3000
  })
  showImageUploader.value = false

  // Refresh product to update images list
  if (product.value) {
    await productsStore.fetchProduct(product.value.id)
  }
}

const handleImageUploadError = (error: string) => {
  toast.add({
    severity: 'error',
    summary: 'Error al subir imagen',
    detail: error || 'No se pudo subir la imagen',
    life: 5000
  })
}

const handleImageDelete = async (imageId: number) => {
  if (!product.value) return

  try {
    const { productsApi } = await import('@/api/products.api')
    const response = await productsApi.deleteImage(product.value.id, imageId)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Imagen eliminada',
        detail: 'La imagen ha sido eliminada correctamente',
        life: 3000
      })

      // Refresh product to update images list
      await productsStore.fetchProduct(product.value.id)
    } else {
      throw new Error(response.message || 'Error al eliminar imagen')
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo eliminar la imagen',
      life: 5000
    })
  }
}

// NetSuite Stock Synchronization
const syncStockWithNetsuite = async () => {
  if (!product.value) return

  isSyncingStock.value = true
  try {
    const { netsuiteApi } = await import('@/api/netsuite.api')
    const response = await netsuiteApi.syncProductStock(product.value.id)

    if (response.success && response.data) {
      const { previous_stock, current_stock, difference } = response.data

      // Update local product stock
      if (product.value) {
        product.value.stock = current_stock
      }

      // Update netsuiteStock for display
      netsuiteStock.value = current_stock

      toast.add({
        severity: 'success',
        summary: 'Stock sincronizado',
        detail: `Stock actualizado de ${previous_stock} a ${current_stock} unidades (${difference >= 0 ? '+' : ''}${difference})`,
        life: 5000
      })

      // Refresh product data
      await productsStore.fetchProduct(product.value.id)
    } else {
      throw new Error(response.message || 'Error al sincronizar stock')
    }
  } catch (error: any) {
    console.error('Error syncing stock:', error)
    toast.add({
      severity: 'error',
      summary: 'Error al sincronizar',
      detail: error.message || 'No se pudo sincronizar el stock con NetSuite',
      life: 5000
    })
  } finally {
    isSyncingStock.value = false
  }
}

const queryNetsuiteStock = async () => {
  if (!product.value) return

  try {
    const { netsuiteApi } = await import('@/api/netsuite.api')
    const response = await netsuiteApi.getProductNetsuiteStock(product.value.id)

    if (response.success && response.data) {
      netsuiteStock.value = response.data.netsuite_stock

      toast.add({
        severity: 'info',
        summary: 'Stock en NetSuite',
        detail: `Stock disponible: ${response.data.netsuite_stock} unidades`,
        life: 5000
      })
    } else {
      throw new Error(response.message || 'Error al consultar stock')
    }
  } catch (error: any) {
    console.error('Error querying NetSuite stock:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo consultar el stock en NetSuite',
      life: 5000
    })
  }
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
