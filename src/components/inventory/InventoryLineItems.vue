<script setup lang="ts">
/**
 * Editor de líneas para movimientos y transferencias de inventario: busca
 * productos, los agrega y edita la cantidad.
 *
 * Los productos con variantes se excluyen del buscador: el API acepta
 * `productoatributo_id` por línea, pero elegir la variante desde acá pide una
 * UI aparte y v1 no la incluye. Se avisa en el listado en vez de dejar que el
 * comerciante mueva stock del producto padre por error.
 */
import { ref } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import InputNumber from 'primevue/inputnumber'
import AppButton from '@/components/ui/AppButton.vue'
import { productsApi } from '@/api/products.api'
import type { Product } from '@/types/product.types'

export interface InventoryLine {
  producto_id: number
  nombre: string
  sku: string
  cantidad: number
  /** Saldo actual en el almacén de origen, si el contexto lo conoce. */
  disponible?: number
}

const props = withDefaults(
  defineProps<{
    modelValue: InventoryLine[]
    placeholder?: string
  }>(),
  { placeholder: 'Buscar producto por nombre o SKU...' }
)

/**
 * `added` deja que el contenedor complete el saldo disponible de esa línea. Se
 * resuelve por producto y no en bloque: el listado de stock por sucursal está
 * paginado, así que precargarlo dejaría sin dato a casi todo el catálogo.
 */
const emit = defineEmits<{
  'update:modelValue': [InventoryLine[]]
  added: [InventoryLine]
}>()

const query = ref('')
const results = ref<InventoryLine[]>([])
const searching = ref(false)

async function search(event: { query: string }) {
  if (event.query.trim().length < 2) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const response = await productsApi.getProducts({ search: event.query, limit: 10 })
    results.value = (response.data ?? [])
      .filter((p: Product) => !p.has_variation_attributes)
      .filter((p: Product) => !props.modelValue.some((l) => l.producto_id === p.id))
      .map((p: Product) => ({
        producto_id: p.id,
        nombre: p.name,
        sku: p.sku,
        cantidad: 1
      }))
  } catch {
    results.value = []
  } finally {
    searching.value = false
  }
}

function add(event: { value: InventoryLine }) {
  const line = { ...event.value, cantidad: 1 }
  emit('update:modelValue', [...props.modelValue, line])
  emit('added', line)
  query.value = ''
  results.value = []
}

function remove(productoId: number) {
  emit('update:modelValue', props.modelValue.filter((l) => l.producto_id !== productoId))
}

function updateQty(productoId: number, cantidad: number | null) {
  emit(
    'update:modelValue',
    props.modelValue.map((l) =>
      l.producto_id === productoId ? { ...l, cantidad: Math.max(1, cantidad ?? 1) } : l
    )
  )
}

function excede(line: InventoryLine): boolean {
  return line.disponible !== undefined && line.cantidad > line.disponible
}
</script>

<template>
  <div>
    <AutoComplete
      v-model="query"
      :suggestions="results"
      option-label="nombre"
      :placeholder="placeholder"
      class="w-full"
      :loading="searching"
      @complete="search"
      @item-select="add"
    >
      <template #option="{ option }">
        <div class="flex flex-col">
          <span class="text-sm text-gray-800">{{ option.nombre }}</span>
          <span class="text-xs text-gray-500">{{ option.sku || 'sin SKU' }}</span>
        </div>
      </template>
    </AutoComplete>

    <p v-if="!modelValue.length" class="text-sm text-gray-500 mt-3">
      Todavía no agregaste productos.
    </p>

    <div v-else class="mt-3 border border-gray-200 rounded-lg divide-y">
      <div
        v-for="line in modelValue"
        :key="line.producto_id"
        class="flex items-center gap-3 p-3"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 truncate">{{ line.nombre }}</p>
          <p class="text-xs text-gray-500">
            {{ line.sku || 'sin SKU' }}
            <span v-if="line.disponible !== undefined"> · disponible: {{ line.disponible }}</span>
          </p>
        </div>

        <InputNumber
          :model-value="line.cantidad"
          :min="1"
          :max="999999"
          show-buttons
          button-layout="horizontal"
          input-class="w-16 text-center"
          decrement-button-class="p-button-secondary"
          increment-button-class="p-button-secondary"
          @update:model-value="(v: number) => updateQty(line.producto_id, v)"
        />

        <AppButton
          icon="pi pi-trash"
          variant="text"
          size="small"
          aria-label="Quitar producto"
          @click="remove(line.producto_id)"
        />
      </div>
    </div>

    <p
      v-if="modelValue.some(excede)"
      class="text-sm text-red-600 mt-2"
    >
      Hay líneas que superan el stock disponible en el almacén de origen.
    </p>
  </div>
</template>
