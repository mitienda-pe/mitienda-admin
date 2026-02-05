<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="router.push({ name: 'marketing-combos' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Combo' : 'Nuevo Combo' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los productos y precio del combo' : 'Crea un nuevo combo de productos' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Info Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4">Información Básica</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Nombre del Combo <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.tiendacombo_nombre"
                class="w-full"
                :class="{ 'p-invalid': formErrors.nombre }"
                placeholder="Ej: Pack Escolar Completo"
              />
              <small v-if="formErrors.nombre" class="text-red-500">{{ formErrors.nombre }}</small>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Descripción
              </label>
              <Textarea
                v-model="formData.tiendacombo_descripcion"
                class="w-full"
                rows="3"
                placeholder="Descripción del combo (aparece en el catálogo)"
              />
            </div>
          </div>
        </div>

        <!-- Products Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-2">Productos del Combo</h2>
          <p class="text-sm text-secondary-500 mb-4">
            Agrega los productos que incluye este combo
          </p>

          <!-- Product Search -->
          <div class="flex gap-2 mb-4">
            <AutoComplete
              v-model="productSearchQuery"
              :suggestions="productSearchResults"
              optionLabel="producto_nombre"
              placeholder="Buscar producto para agregar..."
              class="flex-1"
              @complete="searchProducts"
              @item-select="addProduct"
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

          <!-- Products List -->
          <div v-if="comboProducts.length > 0" class="border rounded-lg divide-y">
            <div
              v-for="(product, index) in comboProducts"
              :key="product.producto_id"
              class="flex items-center justify-between p-3"
            >
              <div class="flex items-center gap-3 flex-1">
                <span class="text-secondary-400 w-6">{{ index + 1 }}.</span>
                <img
                  v-if="product.producto_imagen"
                  :src="getImageUrl(product.producto_imagen)"
                  class="w-10 h-10 object-cover rounded"
                />
                <div v-else class="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <i class="pi pi-image text-gray-400"></i>
                </div>
                <div class="flex-1">
                  <div class="font-medium">{{ product.producto_nombre }}</div>
                  <div class="text-xs text-gray-500">{{ formatCurrency(product.producto_precio) }} c/u</div>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <label class="text-sm text-secondary-600">Cant:</label>
                  <InputNumber
                    v-model="product.cantidad"
                    :min="1"
                    :max="99"
                    showButtons
                    buttonLayout="horizontal"
                    class="w-24"
                    inputClass="w-12 text-center"
                    @input="recalculateRegularPrice"
                  />
                </div>
                <div class="text-right w-20">
                  <div class="text-sm font-medium">
                    {{ formatCurrency(product.producto_precio * product.cantidad) }}
                  </div>
                </div>
                <Button
                  icon="pi pi-times"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click="removeProduct(product.producto_id)"
                />
              </div>
            </div>

            <!-- Subtotal -->
            <div class="p-3 bg-gray-50 flex justify-between items-center">
              <span class="font-medium text-secondary-600">Precio Regular (suma):</span>
              <span class="text-lg font-semibold">{{ formatCurrency(calculatedRegularPrice) }}</span>
            </div>
          </div>
          <div v-else class="text-center py-8 border rounded-lg border-dashed">
            <i class="pi pi-box text-4xl text-secondary-300 mb-2"></i>
            <p class="text-secondary-500">No hay productos en el combo</p>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Image Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4">Imagen del Combo</h2>

          <div
            class="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
            @click="triggerImageUpload"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
          >
            <img
              v-if="imagePreview"
              :src="imagePreview"
              class="max-w-full h-40 object-contain mx-auto rounded"
            />
            <div v-else class="py-8">
              <i class="pi pi-image text-4xl text-secondary-300 mb-2"></i>
              <p class="text-secondary-500 text-sm">Haz clic o arrastra una imagen</p>
              <p class="text-secondary-400 text-xs mt-1">JPG, PNG o WebP (máx. 2MB)</p>
            </div>
          </div>
          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleImageSelect"
          />

          <Button
            v-if="imagePreview"
            label="Quitar imagen"
            icon="pi pi-times"
            severity="secondary"
            text
            size="small"
            class="mt-2 w-full"
            @click="removeImage"
          />
        </div>

        <!-- Pricing Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4">Precio del Combo</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Precio del Combo <span class="text-red-500">*</span>
              </label>
              <InputNumber
                v-model="formData.tiendacombo_precio"
                mode="currency"
                currency="PEN"
                locale="es-PE"
                class="w-full"
                :class="{ 'p-invalid': formErrors.precio }"
              />
              <small v-if="formErrors.precio" class="text-red-500">{{ formErrors.precio }}</small>
            </div>

            <!-- Savings Display -->
            <div v-if="calculatedRegularPrice > 0 && formData.tiendacombo_precio" class="p-3 bg-green-50 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-green-700 text-sm">Ahorro:</span>
                <span class="text-green-700 font-semibold">
                  {{ formatCurrency(calculatedRegularPrice - formData.tiendacombo_precio) }}
                  ({{ savingsPercent }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4">Configuración</h2>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium text-secondary-700">Combo activo</span>
                <p class="text-xs text-secondary-400">El combo está disponible para venta</p>
              </div>
              <InputSwitch v-model="formActive" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium text-secondary-700">Mostrar en catálogo</span>
                <p class="text-xs text-secondary-400">Aparece como producto en la tienda</p>
              </div>
              <InputSwitch v-model="showInCatalog" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium text-secondary-700">Mostrar en carrito</span>
                <p class="text-xs text-secondary-400">"Comprado junto habitualmente"</p>
              </div>
              <InputSwitch v-model="showInCart" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2">
          <Button
            :label="isEditMode ? 'Guardar Cambios' : 'Crear Combo'"
            icon="pi pi-check"
            :loading="comboStore.isSaving"
            @click="saveCombo"
          />
          <Button
            label="Cancelar"
            severity="secondary"
            text
            @click="router.push({ name: 'marketing-combos' })"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useComboStore } from '@/stores/combo.store'
import { productsApi } from '@/api/products.api'
import type { Product } from '@/types/product.types'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'
import ProgressSpinner from 'primevue/progressspinner'

interface ComboProductItem {
  producto_id: number
  producto_nombre: string
  producto_precio: number
  producto_imagen?: string
  cantidad: number
}

const router = useRouter()
const route = useRoute()
const comboStore = useComboStore()
const toast = useToast()
const { formatCurrency } = useFormatters()

const isLoading = ref(false)
const isEditMode = computed(() => !!route.params.id)

// Form data
const formData = ref({
  tiendacombo_nombre: '',
  tiendacombo_descripcion: '',
  tiendacombo_precio: 0
})
const formActive = ref(true)
const showInCatalog = ref(true)
const showInCart = ref(true)
const formErrors = ref<Record<string, string>>({})

// Products
const comboProducts = ref<ComboProductItem[]>([])

// Image
const imageInput = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const imageFile = ref<File | null>(null)

// Search
const productSearchQuery = ref('')
const productSearchResults = ref<ComboProductItem[]>([])

// Computed
const calculatedRegularPrice = computed(() => {
  return comboProducts.value.reduce((sum, p) => sum + (p.producto_precio * p.cantidad), 0)
})

const savingsPercent = computed(() => {
  if (calculatedRegularPrice.value <= 0 || !formData.value.tiendacombo_precio) return 0
  const savings = calculatedRegularPrice.value - formData.value.tiendacombo_precio
  return Math.round((savings / calculatedRegularPrice.value) * 100)
})

// Image URL helper
const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (path.startsWith('data:')) return path
  return `https://api2.mitienda.pe/${path}`
}

// Image handling
const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

const handleImageDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

const processImageFile = (file: File) => {
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'La imagen es muy grande (máx. 2MB)',
      life: 3000
    })
    return
  }

  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  imagePreview.value = null
  imageFile.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// Search products
const searchProducts = async (event: { query: string }) => {
  if (event.query.length < 2) return

  try {
    const response = await productsApi.getProducts({ search: event.query, limit: 10 })
    productSearchResults.value = response.data
      .filter((p: Product) => !comboProducts.value.some(cp => cp.producto_id === p.id))
      .map((p: Product) => ({
        producto_id: p.id,
        producto_nombre: p.name,
        producto_precio: p.price,
        producto_imagen: p.images?.[0]?.url,
        cantidad: 1
      }))
  } catch {
    productSearchResults.value = []
  }
}

// Add/remove products
const addProduct = (event: { value: ComboProductItem }) => {
  if (!comboProducts.value.some(p => p.producto_id === event.value.producto_id)) {
    comboProducts.value.push({ ...event.value, cantidad: 1 })
    recalculateRegularPrice()
  }
  productSearchQuery.value = ''
}

const removeProduct = (productoId: number) => {
  comboProducts.value = comboProducts.value.filter(p => p.producto_id !== productoId)
  recalculateRegularPrice()
}

const recalculateRegularPrice = () => {
  // The computed property handles this automatically
  // But we can suggest a price if not set
  if (!formData.value.tiendacombo_precio && calculatedRegularPrice.value > 0) {
    // Suggest 10% discount as default
    formData.value.tiendacombo_precio = Math.round(calculatedRegularPrice.value * 0.9 * 100) / 100
  }
}

// Validation
const validateForm = (): boolean => {
  formErrors.value = {}

  if (!formData.value.tiendacombo_nombre || formData.value.tiendacombo_nombre.trim().length < 2) {
    formErrors.value.nombre = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  if (!formData.value.tiendacombo_precio || formData.value.tiendacombo_precio <= 0) {
    formErrors.value.precio = 'El precio es requerido y debe ser mayor a 0'
  }

  if (comboProducts.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Atención',
      detail: 'Agrega al menos un producto al combo',
      life: 3000
    })
    return false
  }

  return Object.keys(formErrors.value).length === 0
}

// Save
const saveCombo = async () => {
  if (!validateForm()) return

  try {
    const data = {
      tiendacombo_nombre: formData.value.tiendacombo_nombre,
      tiendacombo_descripcion: formData.value.tiendacombo_descripcion || undefined,
      tiendacombo_precio: formData.value.tiendacombo_precio,
      tiendacombo_precioregular: calculatedRegularPrice.value,
      tiendacombo_mostrar_catalogo: showInCatalog.value ? 1 : 0,
      tiendacombo_mostrar_carrito: showInCart.value ? 1 : 0,
      tiendacombo_activo: formActive.value ? 1 : 0,
      products: comboProducts.value.map(p => ({
        producto_id: p.producto_id,
        cantidad: p.cantidad
      }))
    }

    let savedCombo
    if (isEditMode.value) {
      savedCombo = await comboStore.updateCombo(Number(route.params.id), data)
    } else {
      savedCombo = await comboStore.createCombo(data)
    }

    // Upload image if there's a new one
    if (imageFile.value && savedCombo) {
      await comboStore.uploadImage(savedCombo.tiendacombo_id, imageFile.value)
    }

    toast.add({
      severity: 'success',
      summary: isEditMode.value ? 'Guardado' : 'Creado',
      detail: `Combo ${isEditMode.value ? 'actualizado' : 'creado'} correctamente`,
      life: 3000
    })

    router.push({ name: 'marketing-combos' })
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
    const combo = await comboStore.fetchCombo(Number(route.params.id))

    if (combo) {
      formData.value = {
        tiendacombo_nombre: combo.tiendacombo_nombre,
        tiendacombo_descripcion: combo.tiendacombo_descripcion || '',
        tiendacombo_precio: combo.tiendacombo_precio
      }
      formActive.value = combo.tiendacombo_activo === 1
      showInCatalog.value = combo.tiendacombo_mostrar_catalogo === 1
      showInCart.value = combo.tiendacombo_mostrar_carrito === 1

      if (combo.tiendacombo_imagen) {
        imagePreview.value = getImageUrl(combo.tiendacombo_imagen)
      }

      // Load products
      if (combo.products) {
        comboProducts.value = combo.products.map(p => ({
          producto_id: p.producto_id,
          producto_nombre: p.producto_nombre || '',
          producto_precio: p.producto_precio || 0,
          producto_imagen: p.producto_imagen,
          cantidad: p.tiendacomboproducto_cantidad
        }))
      }
    }
    isLoading.value = false
  }
})
</script>
