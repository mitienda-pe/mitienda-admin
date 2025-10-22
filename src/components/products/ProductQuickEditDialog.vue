<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref<ProductQuickEditData>({
  price: 0,
  stock: 0,
  published: false,
  order: undefined,
  barcode: undefined
})

const errors = ref({
  price: '',
  stock: ''
})

// Actualizar form cuando cambia el producto
watch(() => props.product, (newProduct) => {
  if (newProduct) {
    formData.value = {
      price: newProduct.price,
      stock: newProduct.stock,
      published: newProduct.published,
      order: newProduct.order,
      barcode: newProduct.barcode
    }
    errors.value = { price: '', stock: '' }
  }
}, { immediate: true })

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
        />
        <small class="text-gray-500">Código de barras del producto (EAN, UPC, etc.)</small>
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
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          @click="handleClose"
        />
        <Button
          label="Guardar Cambios"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>
