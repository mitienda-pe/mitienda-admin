<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="router.push({ name: 'marketing-upsales' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Upsale' : 'Nuevo Upsale' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los productos del upsale' : 'Crea un nuevo upsale para sugerir productos' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="space-y-6">
      <!-- Basic Info Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4">Información Básica</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Nombre <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="formData.tiendaupsale_nombre"
              class="w-full"
              :class="{ 'p-invalid': formErrors.nombre }"
              placeholder="Ej: Accesorios para laptops"
            />
            <small v-if="formErrors.nombre" class="text-red-500">{{ formErrors.nombre }}</small>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Estado
            </label>
            <div class="flex items-center gap-3 mt-2">
              <InputSwitch v-model="formActive" />
              <span class="text-secondary-700">{{ formActive ? 'Activo' : 'Inactivo' }}</span>
            </div>
          </div>

          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Descripción
            </label>
            <Textarea
              v-model="formData.tiendaupsale_descripcion"
              class="w-full"
              rows="3"
              placeholder="Descripción opcional del upsale"
            />
          </div>
        </div>
      </div>

      <!-- Trigger Products Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-2">Productos Trigger</h2>
        <p class="text-sm text-secondary-500 mb-4">
          Cuando alguno de estos productos esté en el carrito, se mostrarán los productos sugeridos
        </p>

        <!-- Product Search -->
        <div class="flex gap-2 mb-4">
          <AutoComplete
            v-model="triggerSearchQuery"
            :suggestions="triggerSearchResults"
            optionLabel="producto_nombre"
            placeholder="Buscar producto para agregar..."
            class="flex-1"
            @complete="searchTriggerProducts"
            @item-select="addTriggerProduct"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <img
                  v-if="option.producto_imagen"
                  :src="getImageUrl(option.producto_imagen)"
                  class="w-8 h-8 object-cover rounded"
                />
                <div v-else class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <i class="pi pi-image text-gray-400"></i>
                </div>
                <div>
                  <div class="font-medium">{{ option.producto_nombre }}</div>
                  <div class="text-xs text-gray-500">{{ formatCurrency(option.producto_precio) }}</div>
                </div>
              </div>
            </template>
          </AutoComplete>
        </div>

        <!-- Trigger Products List -->
        <div v-if="triggerProducts.length > 0" class="border rounded-lg divide-y">
          <div
            v-for="product in triggerProducts"
            :key="product.producto_id"
            class="flex items-center justify-between p-3"
          >
            <div class="flex items-center gap-3">
              <img
                v-if="product.producto_imagen"
                :src="getImageUrl(product.producto_imagen)"
                class="w-10 h-10 object-cover rounded"
              />
              <div v-else class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                <i class="pi pi-image text-gray-400"></i>
              </div>
              <div>
                <div class="font-medium">{{ product.producto_nombre }}</div>
                <div class="text-xs text-gray-500">{{ formatCurrency(product.producto_precio) }}</div>
              </div>
            </div>
            <Button
              icon="pi pi-times"
              text
              rounded
              size="small"
              severity="danger"
              @click="removeTriggerProduct(product.producto_id)"
            />
          </div>
        </div>
        <div v-else class="text-center py-8 border rounded-lg border-dashed">
          <i class="pi pi-shopping-cart text-4xl text-secondary-300 mb-2"></i>
          <p class="text-secondary-500">No hay productos trigger</p>
        </div>
      </div>

      <!-- Suggested Products Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-2">Productos Sugeridos</h2>
        <p class="text-sm text-secondary-500 mb-4">
          Estos productos se mostrarán como sugerencia en el checkout
        </p>

        <!-- Product Search -->
        <div class="flex gap-2 mb-4">
          <AutoComplete
            v-model="suggestedSearchQuery"
            :suggestions="suggestedSearchResults"
            optionLabel="producto_nombre"
            placeholder="Buscar producto para sugerir..."
            class="flex-1"
            @complete="searchSuggestedProducts"
            @item-select="addSuggestedProduct"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <img
                  v-if="option.producto_imagen"
                  :src="getImageUrl(option.producto_imagen)"
                  class="w-8 h-8 object-cover rounded"
                />
                <div v-else class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                  <i class="pi pi-image text-gray-400"></i>
                </div>
                <div>
                  <div class="font-medium">{{ option.producto_nombre }}</div>
                  <div class="text-xs text-gray-500">{{ formatCurrency(option.producto_precio) }}</div>
                </div>
              </div>
            </template>
          </AutoComplete>
        </div>

        <!-- Suggested Products List -->
        <div v-if="suggestedProducts.length > 0" class="border rounded-lg divide-y">
          <div
            v-for="(product, index) in suggestedProducts"
            :key="product.producto_id"
            class="flex items-center justify-between p-3"
          >
            <div class="flex items-center gap-3">
              <span class="text-secondary-400 w-6">{{ index + 1 }}.</span>
              <img
                v-if="product.producto_imagen"
                :src="getImageUrl(product.producto_imagen)"
                class="w-10 h-10 object-cover rounded"
              />
              <div v-else class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                <i class="pi pi-image text-gray-400"></i>
              </div>
              <div>
                <div class="font-medium">{{ product.producto_nombre }}</div>
                <div class="text-xs text-gray-500">{{ formatCurrency(product.producto_precio) }}</div>
              </div>
            </div>
            <Button
              icon="pi pi-times"
              text
              rounded
              size="small"
              severity="danger"
              @click="removeSuggestedProduct(product.producto_id)"
            />
          </div>
        </div>
        <div v-else class="text-center py-8 border rounded-lg border-dashed">
          <i class="pi pi-gift text-4xl text-secondary-300 mb-2"></i>
          <p class="text-secondary-500">No hay productos sugeridos</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="router.push({ name: 'marketing-upsales' })"
        />
        <Button
          :label="isEditMode ? 'Guardar Cambios' : 'Crear Upsale'"
          icon="pi pi-check"
          :loading="upsaleStore.isSaving"
          @click="saveUpsale"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUpsaleStore } from '@/stores/upsale.store'
import { productsApi } from '@/api/products.api'
import type { Product } from '@/types/product.types'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'
import ProgressSpinner from 'primevue/progressspinner'

interface ProductBasic {
  producto_id: number
  producto_nombre: string
  producto_precio: number
  producto_imagen?: string
}

const router = useRouter()
const route = useRoute()
const upsaleStore = useUpsaleStore()
const toast = useToast()
const { formatCurrency } = useFormatters()

const isLoading = ref(false)
const isEditMode = computed(() => !!route.params.id)

// Form data
const formData = ref({
  tiendaupsale_nombre: '',
  tiendaupsale_descripcion: ''
})
const formActive = ref(true)
const formErrors = ref<Record<string, string>>({})

// Products
const triggerProducts = ref<ProductBasic[]>([])
const suggestedProducts = ref<ProductBasic[]>([])

// Search
const triggerSearchQuery = ref('')
const triggerSearchResults = ref<ProductBasic[]>([])
const suggestedSearchQuery = ref('')
const suggestedSearchResults = ref<ProductBasic[]>([])

// Image URL helper
const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `https://api2.mitienda.pe/${path}`
}

// Search products
const searchTriggerProducts = async (event: { query: string }) => {
  if (event.query.length < 2) return

  try {
    const response = await productsApi.getProducts({ search: event.query, limit: 10 })
    triggerSearchResults.value = response.data
      .filter((p: Product) => !triggerProducts.value.some(tp => tp.producto_id === p.id))
      .map((p: Product) => ({
        producto_id: p.id,
        producto_nombre: p.name,
        producto_precio: p.price,
        producto_imagen: p.images?.[0]?.url
      }))
  } catch {
    triggerSearchResults.value = []
  }
}

const searchSuggestedProducts = async (event: { query: string }) => {
  if (event.query.length < 2) return

  try {
    const response = await productsApi.getProducts({ search: event.query, limit: 10 })
    suggestedSearchResults.value = response.data
      .filter((p: Product) => !suggestedProducts.value.some(sp => sp.producto_id === p.id))
      .map((p: Product) => ({
        producto_id: p.id,
        producto_nombre: p.name,
        producto_precio: p.price,
        producto_imagen: p.images?.[0]?.url
      }))
  } catch {
    suggestedSearchResults.value = []
  }
}

// Add/remove products
const addTriggerProduct = (event: { value: ProductBasic }) => {
  if (!triggerProducts.value.some(p => p.producto_id === event.value.producto_id)) {
    triggerProducts.value.push(event.value)
  }
  triggerSearchQuery.value = ''
}

const removeTriggerProduct = (productoId: number) => {
  triggerProducts.value = triggerProducts.value.filter(p => p.producto_id !== productoId)
}

const addSuggestedProduct = (event: { value: ProductBasic }) => {
  if (!suggestedProducts.value.some(p => p.producto_id === event.value.producto_id)) {
    suggestedProducts.value.push(event.value)
  }
  suggestedSearchQuery.value = ''
}

const removeSuggestedProduct = (productoId: number) => {
  suggestedProducts.value = suggestedProducts.value.filter(p => p.producto_id !== productoId)
}

// Validation
const validateForm = (): boolean => {
  formErrors.value = {}

  if (!formData.value.tiendaupsale_nombre || formData.value.tiendaupsale_nombre.trim().length < 2) {
    formErrors.value.nombre = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  return Object.keys(formErrors.value).length === 0
}

// Save
const saveUpsale = async () => {
  if (!validateForm()) return

  try {
    const data = {
      tiendaupsale_nombre: formData.value.tiendaupsale_nombre,
      tiendaupsale_descripcion: formData.value.tiendaupsale_descripcion || undefined,
      tiendaupsale_activo: formActive.value ? 1 : 0,
      triggers: triggerProducts.value.map(p => p.producto_id),
      suggested: suggestedProducts.value.map(p => p.producto_id)
    }

    if (isEditMode.value) {
      await upsaleStore.updateUpsale(Number(route.params.id), data)
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'Upsale actualizado correctamente',
        life: 3000
      })
    } else {
      await upsaleStore.createUpsale(data)
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Upsale creado correctamente',
        life: 3000
      })
    }

    router.push({ name: 'marketing-upsales' })
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Error al guardar'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  }
}

// Load data for edit mode
onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true
    const upsale = await upsaleStore.fetchUpsale(Number(route.params.id))

    if (upsale) {
      formData.value = {
        tiendaupsale_nombre: upsale.tiendaupsale_nombre,
        tiendaupsale_descripcion: upsale.tiendaupsale_descripcion || ''
      }
      formActive.value = upsale.tiendaupsale_activo === 1

      // Load trigger products
      if (upsale.triggers) {
        triggerProducts.value = upsale.triggers.map(t => ({
          producto_id: t.producto_id,
          producto_nombre: t.producto_nombre || '',
          producto_precio: t.producto_precio || 0,
          producto_imagen: t.producto_imagen
        }))
      }

      // Load suggested products
      if (upsale.suggested) {
        suggestedProducts.value = upsale.suggested.map(s => ({
          producto_id: s.producto_id,
          producto_nombre: s.producto_nombre || '',
          producto_precio: s.producto_precio || 0,
          producto_imagen: s.producto_imagen
        }))
      }
    }
    isLoading.value = false
  }
})
</script>
