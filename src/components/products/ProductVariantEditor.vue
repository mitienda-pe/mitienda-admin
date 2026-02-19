<template>
  <div class="bg-white rounded-lg shadow">
    <!-- Header -->
    <div class="p-6 border-b">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-secondary">Variantes del Producto</h2>
          <p class="text-sm text-secondary-500 mt-1">
            Define combinaciones de atributos con precio y stock independientes.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <label for="has-variants-toggle" class="text-sm font-medium text-secondary-700">
            Tiene variantes
          </label>
          <InputSwitch
            v-model="hasVariants"
            inputId="has-variants-toggle"
            @change="handleToggle"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-if="hasVariants" class="p-6">
      <!-- Loading existing variants -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <!-- State: No variants yet -> show selector -->
      <div v-else-if="variants.length === 0 && !showSelector">
        <div class="text-center py-8">
          <i class="pi pi-cog text-5xl text-secondary-300 mb-3"></i>
          <p class="text-secondary-500 mb-4">
            Este producto no tiene variantes configuradas.
          </p>
          <Button
            label="Configurar Variantes"
            icon="pi pi-plus"
            @click="showSelector = true"
          />
        </div>
      </div>

      <!-- State: Attribute Selector -->
      <div v-else-if="showSelector">
        <VariantAttributeSelector
          ref="selectorRef"
          :product-id="productId"
          @generate="handleGenerate"
        />
      </div>

      <!-- State: Variant Table (generated or loaded) -->
      <div v-else>
        <!-- Toolbar -->
        <div class="flex items-center justify-between mb-4">
          <Button
            label="Reconfigurar Atributos"
            icon="pi pi-refresh"
            text
            size="small"
            severity="secondary"
            @click="showSelector = true"
          />
          <div class="flex gap-2">
            <Button
              label="Guardar Variantes"
              icon="pi pi-save"
              :loading="isSaving"
              @click="handleSave"
            />
          </div>
        </div>

        <!-- Table -->
        <VariantTable
          :variants="variants"
          :loading="isSaving"
          @update="isDirty = true"
          @remove="handleRemoveVariant"
        />
      </div>
    </div>

    <!-- Disabled state -->
    <div v-else class="p-6 text-center text-secondary-400">
      <p class="text-sm">
        Activa las variantes para definir combinaciones de atributos con precio y stock independientes.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productsApi } from '@/api/products.api'
import type {
  ProductVariant,
  GenerateVariantsPayload,
  SaveVariantsPayload,
} from '@/types/product.types'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import VariantAttributeSelector from './VariantAttributeSelector.vue'
import VariantTable from './VariantTable.vue'

const props = defineProps<{
  productId: number
  hasVariantsProp: boolean
  defaultPrice?: number
}>()

const emit = defineEmits<{
  variantsSaved: []
  variantsToggle: [hasVariants: boolean]
}>()

const toast = useToast()

// State
const hasVariants = ref(props.hasVariantsProp)
const variants = ref<ProductVariant[]>([])
const deletedIds = ref<number[]>([])
const showSelector = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const isDirty = ref(false)
const selectorRef = ref<InstanceType<typeof VariantAttributeSelector> | null>(null)

// Methods
async function loadExistingVariants() {
  if (!props.hasVariantsProp) return

  isLoading.value = true
  try {
    const response = await productsApi.getVariants(props.productId)
    if (response.success && response.data) {
      variants.value = response.data.variants || []
    }
  } catch (err) {
    console.error('Error loading variants:', err)
  } finally {
    isLoading.value = false
  }
}

function handleToggle() {
  if (!hasVariants.value && variants.value.length > 0) {
    // Warn: turning off variants
    const confirmed = window.confirm(
      '¿Estás seguro? Las variantes existentes se desactivarán y el producto usará precio fijo.'
    )
    if (!confirmed) {
      hasVariants.value = true
      return
    }
    // Mark all existing variants for deletion
    for (const v of variants.value) {
      if (v.id) deletedIds.value.push(v.id)
    }
    variants.value = []
    handleSave()
  }
  emit('variantsToggle', hasVariants.value)
}

async function handleGenerate(payload: GenerateVariantsPayload) {
  if (selectorRef.value) {
    selectorRef.value.generating = true
  }

  try {
    const response = await productsApi.generateVariants(props.productId, payload)
    if (response.success && response.data) {
      // Merge with existing variants: keep existing ones that match, add new ones
      const existingMap = new Map<string, ProductVariant>()
      for (const v of variants.value) {
        existingMap.set(v.names, v)
      }

      const newVariants: ProductVariant[] = []
      for (const generated of response.data.variants) {
        const existing = existingMap.get(generated.names)
        if (existing) {
          // Keep existing data (price, stock, sku)
          newVariants.push(existing)
        } else {
          newVariants.push(generated)
        }
      }

      variants.value = newVariants
      showSelector.value = false
      isDirty.value = true

      toast.add({
        severity: 'success',
        summary: `${response.data.count} variantes generadas`,
        life: 3000,
      })
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al generar variantes',
      life: 5000,
    })
  } finally {
    if (selectorRef.value) {
      selectorRef.value.generating = false
    }
  }
}

function handleRemoveVariant(index: number) {
  const variant = variants.value[index]
  if (variant.id) {
    deletedIds.value.push(variant.id)
  }
  variants.value.splice(index, 1)
  isDirty.value = true
}

async function handleSave() {
  isSaving.value = true

  const payload: SaveVariantsPayload = {
    variants: variants.value.map(v => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      offer_price: v.offer_price,
      stock: v.stock,
      unlimited_stock: v.unlimited_stock,
      image_id: v.image_id,
      details: v.details.map(d => ({
        store_attribute_id: d.store_attribute_id,
        option_id: d.option_id,
        global_attribute_id: d.global_attribute_id,
      })),
    })),
    deleted_ids: deletedIds.value,
  }

  try {
    const response = await productsApi.saveVariants(props.productId, payload)
    if (response.success) {
      isDirty.value = false
      deletedIds.value = []

      toast.add({
        severity: 'success',
        summary: 'Variantes guardadas',
        detail: `${response.data?.count || variants.value.length} variantes guardadas correctamente`,
        life: 3000,
      })

      // Reload to get server-generated IDs
      await loadExistingVariants()
      emit('variantsSaved')
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al guardar las variantes',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadExistingVariants()
})
</script>
