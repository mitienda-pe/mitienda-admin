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
              v-if="getImageUrl(data.image_id)"
              :src="getImageUrl(data.image_id)"
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

      <!-- Variant Name (read-only) -->
      <Column header="Variante" style="min-width: 180px">
        <template #body="{ data }">
          <span class="font-medium text-secondary-700">{{ data.names }}</span>
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

      <!-- Price -->
      <Column header="Precio" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.price"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            prefix="S/ "
            class="w-full p-inputtext-sm"
            @input="emitUpdate"
          />
        </template>
      </Column>

      <!-- Offer Price -->
      <Column header="P. Oferta" style="min-width: 130px">
        <template #body="{ data }">
          <InputNumber
            v-model="data.offer_price"
            mode="decimal"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            prefix="S/ "
            class="w-full p-inputtext-sm"
            placeholder="Opcional"
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
            :class="editingVariant?.image_id === img.id ? 'border-primary ring-1 ring-primary' : 'border-secondary-200'"
            @click="selectImage(img.id)"
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
        Rango: S/ {{ priceRange.min.toFixed(2) }} - S/ {{ priceRange.max.toFixed(2) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProductVariant } from '@/types/product.types'
import type { ProductImage } from '@/types/product.types'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import OverlayPanel from 'primevue/overlaypanel'

const props = defineProps<{
  variants: ProductVariant[]
  images: ProductImage[]
  loading?: boolean
}>()

const emit = defineEmits<{
  update: []
  remove: [index: number]
}>()

const imagePickerRef = ref()
const editingVariant = ref<ProductVariant | null>(null)

const imageMap = computed(() => {
  const map = new Map<number, string>()
  for (const img of props.images) {
    map.set(img.id, img.url)
  }
  return map
})

function getImageUrl(imageId: number | null): string | undefined {
  if (!imageId) return undefined
  return imageMap.value.get(imageId)
}

function openImagePicker(variant: ProductVariant, event: Event) {
  editingVariant.value = variant
  imagePickerRef.value?.toggle(event)
}

function selectImage(imageId: number | null) {
  if (editingVariant.value) {
    editingVariant.value.image_id = imageId
    emitUpdate()
  }
  imagePickerRef.value?.hide()
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
