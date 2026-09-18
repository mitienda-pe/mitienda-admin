<template>
  <div>
    <DataTable
      :value="variants"
      :loading="loading"
      stripedRows
      class="p-datatable-sm"
      editMode="cell"
      responsiveLayout="scroll"
    >
      <!-- Image -->
      <Column header="Imagen" style="width: 80px">
        <template #body="{ data }">
          <div class="relative" @click="openImagePicker(data, $event)">
            <img
              v-if="variantThumb(data)"
              :src="variantThumb(data)"
              class="w-12 h-12 object-cover rounded border cursor-pointer hover:ring-2 hover:ring-primary"
              :alt="data.names"
            />
            <div
              v-else
              class="w-12 h-12 rounded border border-dashed border-secondary-300 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5"
            >
              <i class="pi pi-image text-secondary-400 text-sm" />
            </div>
          </div>
        </template>
      </Column>

      <!-- Variante: editable si tiene un solo atributo (ver isEditable) -->
      <Column header="Variante" style="min-width: 200px">
        <template #body="{ data }">
          <InputText
            v-if="isEditable(data)"
            :modelValue="optionText(data)"
            class="w-full p-inputtext-sm font-medium"
            :placeholder="optionPlaceholder"
            @update:modelValue="setOptionText(data, $event ?? '')"
          />
          <span v-else class="font-medium text-secondary-700">{{ data.names }}</span>
        </template>
      </Column>

      <!-- SKU -->
      <Column header="SKU" style="min-width: 150px">
        <template #body="{ data }">
          <InputText
            v-model="data.sku"
            class="w-full p-inputtext-sm"
            placeholder="SKU"
            @change="emitUpdate"
          />
        </template>
      </Column>

      <!-- Barcode (código de barras propio de la variación, opcional) -->
      <Column header="Código de barras" style="min-width: 170px">
        <template #body="{ data }">
          <InputText
            v-model="data.barcode"
            class="w-full p-inputtext-sm"
            placeholder="Ej: 7501234567890"
            @change="emitUpdate"
          />
        </template>
      </Column>

      <!-- Price -->
      <Column header="Precio" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.price"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :prefix="`${currencySymbol} `"
            class="w-full p-inputtext-sm"
            @input="emitUpdate"
          />
        </template>
      </Column>

      <!-- Price without tax (auto-calculated) -->
      <Column header="P. sin IGV" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            :modelValue="calcPriceSinIgv(data.price)"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :prefix="`${currencySymbol} `"
            class="w-full p-inputtext-sm"
            disabled
          />
        </template>
      </Column>

      <!-- Costo de compra (para calcular ganancia; no visible al cliente) -->
      <Column header="Costo" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.cost"
            mode="decimal"
            :min="0"
            :minFractionDigits="2"
            :maxFractionDigits="4"
            :prefix="`${currencySymbol} `"
            class="w-full p-inputtext-sm"
            @input="emitUpdate"
          />
        </template>
      </Column>

      <!-- Stock -->
      <Column header="Stock" style="min-width: 100px">
        <template #body="{ data }">
          <InputNumber
            v-if="!data.unlimited_stock"
            v-model="data.stock"
            :min="0"
            class="w-full p-inputtext-sm"
            @input="emitUpdate"
          />
          <span v-else class="text-sm text-secondary-400 italic">Ilimitado</span>
        </template>
      </Column>

      <!-- Unlimited Stock -->
      <Column header="Ilimitado" style="width: 90px" class="text-center">
        <template #body="{ data }">
          <Checkbox
            v-model="data.unlimited_stock"
            :binary="true"
            @change="emitUpdate"
          />
        </template>
      </Column>

      <!-- Delete -->
      <Column style="width: 60px">
        <template #body="{ index }">
          <Button
            icon="pi pi-trash"
            text
            rounded
            size="small"
            severity="danger"
            @click="removeVariant(index)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Image Picker Overlay -->
    <OverlayPanel ref="imagePickerRef">
      <div class="p-2" style="width: 280px">
        <p class="text-sm font-medium text-secondary-700 mb-2">Seleccionar imagen</p>
        <div class="grid grid-cols-4 gap-2">
          <!-- No image option -->
          <div
            class="w-14 h-14 rounded border-2 flex items-center justify-center cursor-pointer hover:border-primary"
            :class="!editingVariant?.image_id ? 'border-primary bg-primary/5' : 'border-secondary-200'"
            @click="selectImage(null)"
          >
            <i class="pi pi-times text-secondary-400 text-xs" />
          </div>
          <!-- Product images -->
          <div
            v-for="img in images"
            :key="img.id"
            class="w-14 h-14 rounded border-2 overflow-hidden cursor-pointer hover:border-primary"
            :class="Number(editingVariant?.image_id) === Number(img.id) ? 'border-primary ring-1 ring-primary' : 'border-secondary-200'"
            @click="selectImage(img)"
          >
            <img :src="img.url" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </OverlayPanel>

    <!-- Summary -->
    <div v-if="variants.length > 0" class="flex items-center justify-between mt-3 text-sm text-secondary-500">
      <span>{{ variants.length }} variantes</span>
      <span v-if="priceRange">
        Rango: {{ currencySymbol }} {{ priceRange.min.toFixed(2) }} - {{ currencySymbol }} {{ priceRange.max.toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProductVariant } from '@/types/product.types'
import { useFormatters } from '@/composables/useFormatters'
import { useStoreConfigStore } from '@/stores/store-config.store'
import type { ProductImage } from '@/types/product.types'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import OverlayPanel from 'primevue/overlaypanel'

const props = withDefaults(
  defineProps<{
    variants: ProductVariant[]
    images: ProductImage[]
    loading?: boolean
    igvPercent?: number
    /**
     * Atributo al que se cuelgan las opciones escritas a mano. 0 = todavía no
     * se sabe cuál es; sin eso el texto no se puede guardar, así que la celda
     * queda de solo lectura en vez de aceptar algo que se perdería en silencio.
     */
    attributeId?: number
    /** Nombre del atributo, para el placeholder ("Ej: Versión"). */
    attributeName?: string
  }>(),
  { attributeId: 0, attributeName: '' }
)

const emit = defineEmits<{
  update: []
  remove: [index: number]
}>()

const optionPlaceholder = computed(() =>
  props.attributeName ? `Ej: ${props.attributeName}` : 'Escribe la opción'
)

/**
 * Solo se edita el nombre de una variante de UN atributo.
 *
 * Con dos o más (talla × color) el nombre es la combinación y cambiarlo desde
 * una celda no tiene una traducción única a opciones: eso se sigue haciendo
 * desde el selector de atributos.
 *
 * Una variante legacy llega con un detalle de `option_id` 0, `store_attribute_id`
 * 0 y el `names` resuelto por el servidor: es editable igual, tomando el
 * atributo de la prop, y al guardarla el backend asciende su fila en sitio en
 * vez de duplicarla.
 */
function isEditable(variant: ProductVariant): boolean {
  if (variant.details.length !== 1) return false

  return Number(variant.details[0]?.store_attribute_id) > 0 || props.attributeId > 0
}

function optionText(variant: ProductVariant): string {
  const detail = variant.details[0]
  if (!detail) return ''
  return detail.option_text || variant.names || ''
}

function setOptionText(variant: ProductVariant, text: string) {
  const detail = variant.details[0]
  if (!detail) return

  detail.option_text = text
  // Se soltó la opción anterior: el backend la resuelve (o la crea) por texto.
  detail.option_id = 0
  detail.global_attribute_id = 0
  // Las variantes legacy no traen atributo: se lo pone el editor.
  if (!Number(detail.store_attribute_id)) {
    detail.store_attribute_id = props.attributeId
  }
  variant.names = text
  emitUpdate()
}

const imagePickerRef = ref()

const { currencySymbol } = useFormatters()
const editingVariant = ref<ProductVariant | null>(null)

const imageMap = computed(() => {
  // Los ids pueden llegar como string desde la API (MySQL) o como number.
  // Normalizamos a number para evitar misses por type mismatch (string vs number).
  const map = new Map<number, string>()
  for (const img of props.images) {
    const key = Number(img.id)
    if (Number.isFinite(key)) map.set(key, img.url)
  }
  return map
})

function getImageUrl(imageId: number | string | null): string | undefined {
  const key = Number(imageId)
  if (!Number.isFinite(key) || key <= 0) return undefined
  return imageMap.value.get(key)
}

// Miniatura de la variante: preferimos el image_url que ya resuelve el backend
// (robusto ante re-keying legacy→R2 y ante que product.images llegue vacío/desfasado
// al editor); fallback al mapa local por image_id.
function variantThumb(variant: ProductVariant): string | undefined {
  return variant.image_url || getImageUrl(variant.image_id)
}

function openImagePicker(variant: ProductVariant, event: Event) {
  editingVariant.value = variant
  imagePickerRef.value?.toggle(event)
}

function selectImage(img: ProductImage | null) {
  if (editingVariant.value) {
    if (img) {
      const key = Number(img.id)
      editingVariant.value.image_id = Number.isFinite(key) ? key : null
      // Guardamos también la URL para pintar la miniatura sin depender del imageMap.
      editingVariant.value.image_url = img.url ?? null
    } else {
      editingVariant.value.image_id = null
      editingVariant.value.image_url = null
    }
    emitUpdate()
  }
  imagePickerRef.value?.hide()
}

const storeConfigStore = useStoreConfigStore()

function calcPriceSinIgv(price: number | null): number | null {
  if (!price || price <= 0) return null
  const igv = (props.igvPercent || storeConfigStore.taxRatePercent) / 100
  return parseFloat((price / (1 + igv)).toFixed(2))
}

const priceRange = computed(() => {
  if (!props.variants.length) return null
  const prices = props.variants.map(v => v.price).filter(p => p > 0)
  if (!prices.length) return null
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
})

function emitUpdate() {
  emit('update')
}

function removeVariant(index: number) {
  emit('remove', index)
}
</script>
