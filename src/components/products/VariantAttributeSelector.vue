<template>
  <div class="space-y-4">
    <p class="text-sm text-secondary-500">
      Selecciona los atributos y opciones para generar las variantes.
    </p>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- No attributes -->
    <div v-else-if="!storeAttributes.length" class="text-center py-8 text-secondary-400">
      <i class="pi pi-palette text-4xl mb-2"></i>
      <p class="mb-2">No hay atributos definidos.</p>
      <router-link to="/catalog/attributes" class="text-primary hover:underline">
        Crear atributos
      </router-link>
    </div>

    <!-- Attribute list -->
    <div v-else class="space-y-3">
      <div
        v-for="attr in storeAttributes"
        :key="attr.id"
        class="border rounded-lg p-4"
        :class="{ 'border-primary bg-primary/5': isSelected(attr.id) }"
      >
        <!-- Attribute header with checkbox -->
        <div class="flex items-center gap-3 mb-2">
          <Checkbox
            :modelValue="isSelected(attr.id)"
            :binary="true"
            @update:modelValue="toggleAttribute(attr.id)"
          />
          <span class="font-medium text-secondary-700">{{ attr.name }}</span>
          <Tag :value="getTypeLabel(attr.type)" size="small" severity="info" />
          <span class="text-sm text-secondary-400">
            ({{ attr.options?.length || 0 }} opciones)
          </span>
        </div>

        <!-- Options when attribute is selected -->
        <div v-if="isSelected(attr.id) && attr.options?.length" class="ml-8 mt-2">
          <div class="flex items-center gap-2 mb-2">
            <Button
              label="Todas"
              text
              size="small"
              @click="selectAllOptions(attr.id)"
            />
            <Button
              label="Ninguna"
              text
              size="small"
              severity="secondary"
              @click="deselectAllOptions(attr.id)"
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="opt in attr.options"
              :key="opt.id"
              class="flex items-center gap-2"
            >
              <Checkbox
                :modelValue="isOptionSelected(attr.id, opt.id)"
                :binary="true"
                :inputId="`opt-${opt.id}`"
                @update:modelValue="toggleOption(attr.id, opt.id)"
              />
              <label :for="`opt-${opt.id}`" class="text-sm cursor-pointer flex items-center gap-1">
                <!-- Color swatch for color type -->
                <span
                  v-if="attr.type === 2"
                  class="inline-block w-4 h-4 rounded border border-gray-200"
                  :style="{ backgroundColor: opt.text }"
                ></span>
                {{ opt.text }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate button -->
    <div v-if="canGenerate" class="flex items-center justify-between pt-2 border-t">
      <span class="text-sm text-secondary-500">
        {{ estimatedCombinations }} combinaciones se generarán
      </span>
      <Button
        label="Generar Variantes"
        icon="pi pi-cog"
        :loading="generating"
        @click="$emit('generate', buildPayload())"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { productsApi } from '@/api/products.api'
import { ATTRIBUTE_TYPE_LABELS } from '@/types/attribute.types'
import type { AttributeType } from '@/types/attribute.types'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'

interface AttrOption {
  id: number
  text: string
  global_attribute_id: number
}

interface StoreAttr {
  id: number
  name: string
  type: number
  style: number
  options: AttrOption[]
  assigned: boolean
  order: number
}

const props = defineProps<{
  productId: number
}>()

defineEmits<{
  generate: [payload: { attributes: { store_attribute_id: number; option_ids: number[] }[] }]
}>()

// State
const loading = ref(false)
const generating = ref(false)
const storeAttributes = ref<StoreAttr[]>([])
const selectedAttributes = ref<Set<number>>(new Set())
const selectedOptions = ref<Map<number, Set<number>>>(new Map())

// Computed
const canGenerate = computed(() => {
  for (const attrId of selectedAttributes.value) {
    const options = selectedOptions.value.get(attrId)
    if (options && options.size > 0) return true
  }
  return false
})

const estimatedCombinations = computed(() => {
  let total = 1
  let hasAny = false
  for (const attrId of selectedAttributes.value) {
    const options = selectedOptions.value.get(attrId)
    if (options && options.size > 0) {
      total *= options.size
      hasAny = true
    }
  }
  return hasAny ? total : 0
})

// Methods
function getTypeLabel(type: number): string {
  return ATTRIBUTE_TYPE_LABELS[type as AttributeType] || 'Desconocido'
}

function isSelected(attrId: number): boolean {
  return selectedAttributes.value.has(attrId)
}

function isOptionSelected(attrId: number, optionId: number): boolean {
  return selectedOptions.value.get(attrId)?.has(optionId) ?? false
}

function toggleAttribute(attrId: number) {
  if (selectedAttributes.value.has(attrId)) {
    selectedAttributes.value.delete(attrId)
    selectedOptions.value.delete(attrId)
  } else {
    selectedAttributes.value.add(attrId)
    // Auto-select all options
    const attr = storeAttributes.value.find(a => a.id === attrId)
    if (attr?.options) {
      selectedOptions.value.set(attrId, new Set(attr.options.map(o => o.id)))
    }
  }
  // Trigger reactivity
  selectedAttributes.value = new Set(selectedAttributes.value)
  selectedOptions.value = new Map(selectedOptions.value)
}

function toggleOption(attrId: number, optionId: number) {
  const options = selectedOptions.value.get(attrId) ?? new Set<number>()
  if (options.has(optionId)) {
    options.delete(optionId)
  } else {
    options.add(optionId)
  }
  selectedOptions.value.set(attrId, options)
  selectedOptions.value = new Map(selectedOptions.value)
}

function selectAllOptions(attrId: number) {
  const attr = storeAttributes.value.find(a => a.id === attrId)
  if (attr?.options) {
    selectedOptions.value.set(attrId, new Set(attr.options.map(o => o.id)))
    selectedOptions.value = new Map(selectedOptions.value)
  }
}

function deselectAllOptions(attrId: number) {
  selectedOptions.value.set(attrId, new Set())
  selectedOptions.value = new Map(selectedOptions.value)
}

function buildPayload() {
  const attributes: { store_attribute_id: number; option_ids: number[] }[] = []
  for (const attrId of selectedAttributes.value) {
    const options = selectedOptions.value.get(attrId)
    if (options && options.size > 0) {
      attributes.push({
        store_attribute_id: attrId,
        option_ids: Array.from(options),
      })
    }
  }
  return { attributes }
}

async function loadAttributes() {
  loading.value = true
  try {
    const response = await productsApi.getProductAttributes(props.productId)
    if (response.success && response.data) {
      storeAttributes.value = response.data

      // Pre-select already assigned attributes
      for (const attr of response.data) {
        if (attr.assigned) {
          selectedAttributes.value.add(attr.id)
          // Select all options by default for assigned attributes
          if (attr.options) {
            selectedOptions.value.set(attr.id, new Set(attr.options.map((o: AttrOption) => o.id)))
          }
        }
      }
      selectedAttributes.value = new Set(selectedAttributes.value)
      selectedOptions.value = new Map(selectedOptions.value)
    }
  } catch (err) {
    console.error('Error loading attributes:', err)
  } finally {
    loading.value = false
  }
}

// Expose for parent
defineExpose({ generating })

onMounted(() => {
  loadAttributes()
})
</script>
