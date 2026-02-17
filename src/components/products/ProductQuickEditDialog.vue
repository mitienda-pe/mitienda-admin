<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import { useCatalogStore } from '@/stores/catalog.store'
import { useGammaStore } from '@/stores/gamma.store'
import { useFormatters } from '@/composables/useFormatters'
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
  published?: boolean
  barcode?: string
  brand_id?: number | null
  gamma_id?: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const catalogStore = useCatalogStore()
const gammaStore = useGammaStore()
const { formatCurrency } = useFormatters()

const formData = ref<ProductQuickEditData>({
  published: false,
  barcode: undefined,
  brand_id: null,
  gamma_id: null
})

// Computed para obtener gammas filtradas por marca seleccionada
const gammaOptions = computed(() => {
  return gammaStore.gammasByBrand || []
})

// Cargar gammas cuando cambia la marca
const handleBrandChange = async () => {
  formData.value.gamma_id = null
  gammaStore.clearGammasByBrand()

  if (formData.value.brand_id) {
    await gammaStore.fetchByBrand(formData.value.brand_id)
  }
}

// Actualizar form cuando cambia el producto
watch(() => props.product, async (newProduct) => {
  if (newProduct) {
    formData.value = {
      published: newProduct.published,
      barcode: newProduct.barcode,
      brand_id: newProduct.brand?.id || null,
      gamma_id: newProduct.gamma?.id || null
    }

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

const handleSave = () => {
  emit('save', { ...formData.value })
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
    header="Edicion Rapida"
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

      <!-- Precio (solo lectura + enlace) -->
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm text-gray-600">Precio:</span>
            <span class="font-semibold ml-1">{{ formatCurrency(product.price) }}</span>
          </div>
          <router-link
            to="/products/prices"
            class="text-xs text-primary hover:underline"
            @click="handleClose"
          >
            Editar en Precios
          </router-link>
        </div>
        <div class="flex items-center justify-between mt-1">
          <div>
            <span class="text-sm text-gray-600">Stock:</span>
            <span class="font-semibold ml-1">
              {{ product.unlimited_stock ? 'Ilimitado' : product.stock }}
            </span>
          </div>
          <router-link
            to="/products/stock"
            class="text-xs text-primary hover:underline"
            @click="handleClose"
          >
            Editar en Stock
          </router-link>
        </div>
        <div v-if="product.order != null" class="flex items-center justify-between mt-1">
          <div>
            <span class="text-sm text-gray-600">Orden:</span>
            <span class="font-semibold ml-1">{{ product.order }}</span>
          </div>
          <router-link
            to="/products/order"
            class="text-xs text-primary hover:underline"
            @click="handleClose"
          >
            Editar en Orden
          </router-link>
        </div>
      </div>

      <!-- Codigo de barras -->
      <div>
        <label for="barcode" class="block text-sm font-medium text-gray-700 mb-2">
          Codigo de barras
        </label>
        <InputText
          id="barcode"
          v-model="formData.barcode"
          placeholder="Ej: 7501234567890"
          :maxlength="50"
          class="w-full"
        />
        <small class="text-gray-500">Codigo de barras del producto (EAN, UPC, etc.)</small>
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

      <!-- Estado de publicacion -->
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
:deep(.p-dialog-footer .p-button) {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.9375rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

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
