<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { useCatalogStore } from '@/stores/catalog.store'
import { useGammaStore } from '@/stores/gamma.store'
import type { Product } from '@/types/product.types'

interface Props {
  visible: boolean
  product: Product | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: ProductQuickEditData): void
}

export interface ProductQuickEditData {
  price?: number
  stock?: number
  published?: boolean
  order?: number
  barcode?: string
  description_html?: string
  brand_id?: number | null
  gamma_id?: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const catalogStore = useCatalogStore()
const gammaStore = useGammaStore()

const formData = ref<ProductQuickEditData>({
  price: 0,
  stock: 0,
  published: false,
  order: undefined,
  barcode: undefined,
  brand_id: null,
  gamma_id: null
})

const errors = ref({
  price: '',
  stock: ''
})

// Computed para obtener gammas filtradas por marca seleccionada
const gammaOptions = computed(() => {
  return gammaStore.gammasByBrand || []
})

// Cargar gammas cuando cambia la marca
const handleBrandChange = async () => {
  formData.value.gamma_id = null // Resetear gamma cuando cambia la marca
  gammaStore.clearGammasByBrand()

  if (formData.value.brand_id) {
    await gammaStore.fetchByBrand(formData.value.brand_id)
  }
}

// Actualizar form cuando cambia el producto
watch(() => props.product, async (newProduct) => {
  if (newProduct) {
    formData.value = {
      price: newProduct.price,
      stock: newProduct.stock,
      published: newProduct.published,
      order: newProduct.order,
      barcode: newProduct.barcode,
      brand_id: newProduct.brand?.id || null,
      gamma_id: newProduct.gamma?.id || null
    }
    errors.value = { price: '', stock: '' }

    // Cargar gammas si hay una marca seleccionada
    if (newProduct.brand?.id) {
      await gammaStore.fetchByBrand(newProduct.brand.id)
    } else {
      gammaStore.clearGammasByBrand()
    }
  }
}, { immediate: true })

// Cargar marcas al montar si no están cargadas
onMounted(async () => {
  if (catalogStore.brands.length === 0) {
    await catalogStore.fetchBrands()
  }
})

const validateForm = (): boolean => {
  errors.value = { price: '', stock: '' }
  let isValid = true

  if (!formData.value.price || formData.value.price <= 0) {
    errors.value.price = 'El precio debe ser mayor a 0'
    isValid = false
  }

  if (formData.value.stock !== undefined && formData.value.stock < 0) {
    errors.value.stock = 'El stock no puede ser negativo'
    isValid = false
  }

  return isValid
}

const handleSave = () => {
  if (validateForm()) {
    emit('save', { ...formData.value })
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="true"
    :draggable="false"
    header="Edición Rápida"
    class="w-full md:w-[500px]"
    @update:visible="handleClose"
  >
    <div v-if="product" class="space-y-4">
      <!-- Nombre del producto (solo lectura) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Producto</label>
        <p class="text-gray-900 font-semibold">{{ product.name }}</p>
        <p class="text-sm text-gray-500">SKU: {{ product.sku }}</p>
      </div>

      <!-- Precio -->
      <div>
        <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
          Precio <span class="text-red-500">*</span>
        </label>
        <InputNumber
          id="price"
          v-model="formData.price"
          mode="currency"
          currency="PEN"
          locale="es-PE"
          :min="0"
          :min-fraction-digits="2"
          :max-fraction-digits="2"
          class="w-full"
          :class="{ 'p-invalid': errors.price }"
        />
        <small v-if="errors.price" class="text-red-500">{{ errors.price }}</small>
      </div>

      <!-- Stock -->
      <div>
        <label for="stock" class="block text-sm font-medium text-gray-700 mb-2">
          Stock <span class="text-red-500">*</span>
        </label>
        <InputNumber
          id="stock"
          v-model="formData.stock"
          :min="0"
          :use-grouping="false"
          class="w-full"
          :class="{ 'p-invalid': errors.stock }"
        />
        <small v-if="errors.stock" class="text-red-500">{{ errors.stock }}</small>
      </div>

      <!-- Código de barras -->
      <div>
        <label for="barcode" class="block text-sm font-medium text-gray-700 mb-2">
          Código de barras
        </label>
        <InputText
          id="barcode"
          v-model="formData.barcode"
          placeholder="Ej: 7501234567890"
          :maxlength="50"
          class="w-full"
        />
        <small class="text-gray-500">Código de barras del producto (EAN, UPC, etc.)</small>
      </div>

      <!-- Marca -->
      <div>
        <label for="brand" class="block text-sm font-medium text-gray-700 mb-2">
          Marca
        </label>
        <Dropdown
          id="brand"
          v-model="formData.brand_id"
          :options="catalogStore.brands"
          optionLabel="name"
          optionValue="id"
          placeholder="Seleccionar marca"
          showClear
          class="w-full"
          @change="handleBrandChange"
        />
      </div>

      <!-- Gamma (sub-marca) -->
      <div>
        <label for="gamma" class="block text-sm font-medium text-gray-700 mb-2">
          Gamma (sub-marca)
        </label>
        <Dropdown
          id="gamma"
          v-model="formData.gamma_id"
          :options="gammaOptions"
          optionLabel="tiendagamma_nombre"
          optionValue="tiendagamma_id"
          placeholder="Seleccionar gamma"
          showClear
          class="w-full"
          :disabled="!formData.brand_id || gammaOptions.length === 0"
        />
        <small v-if="formData.brand_id && gammaOptions.length === 0" class="text-gray-500">
          Esta marca no tiene gammas registradas
        </small>
      </div>

      <!-- Orden en catálogo -->
      <div>
        <label for="order" class="block text-sm font-medium text-gray-700 mb-2">
          Orden en catálogo
        </label>
        <InputNumber
          id="order"
          v-model="formData.order"
          :min="0"
          :use-grouping="false"
          class="w-full"
          placeholder="Dejar vacío para orden automático"
        />
        <small class="text-gray-500">Número que define la posición del producto en el catálogo</small>
      </div>

      <!-- Estado de publicación -->
      <div class="flex items-center gap-2">
        <Checkbox
          id="published"
          v-model="formData.published"
          :binary="true"
        />
        <label for="published" class="text-sm font-medium text-gray-700 cursor-pointer">
          Publicado
        </label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
        />
        <Button
          label="Guardar Cambios"
          severity="primary"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* Mejorar visibilidad de los botones del footer */
:deep(.p-dialog-footer .p-button) {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

/* Botón Cancelar */
:deep(.p-dialog-footer .p-button-secondary) {
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}

:deep(.p-dialog-footer .p-button-secondary:hover) {
  background-color: #e5e7eb;
  border-color: #9ca3af;
  color: #1f2937;
}

/* Botón Guardar Cambios */
:deep(.p-dialog-footer .p-button-primary) {
  background-color: var(--primary-500);
  border-color: var(--primary-500);
  color: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

:deep(.p-dialog-footer .p-button-primary:hover) {
  background-color: var(--primary-600);
  border-color: var(--primary-600);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
