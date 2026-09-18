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
          <p class="text-secondary-500 mb-1">
            Este producto no tiene variantes configuradas.
          </p>
          <p class="text-sm text-secondary-400 mb-4">
            Agregalas de a una si cada producto tiene opciones distintas, o generalas
            todas juntas si combinás atributos (talla × color).
          </p>
          <div class="flex items-center justify-center gap-2">
            <Button
              label="Agregar variante"
              icon="pi pi-plus"
              @click="handleAddVariant"
            />
            <Button
              label="Generar por atributos"
              icon="pi pi-cog"
              outlined
              @click="showSelector = true"
            />
          </div>
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
          <div class="flex items-center gap-2">
            <Button
              label="Agregar variante"
              icon="pi pi-plus"
              size="small"
              outlined
              @click="handleAddVariant"
            />
            <Button
              label="Reconfigurar Atributos"
              icon="pi pi-refresh"
              text
              size="small"
              severity="secondary"
              @click="showSelector = true"
            />
          </div>
          <div class="flex gap-2">
            <Button
              label="Guardar Variantes"
              icon="pi pi-save"
              :loading="isSaving"
              @click="handleSave"
            />
          </div>
        </div>

        <p v-if="activeAttributeName" class="text-sm text-secondary-500 mb-3">
          Las opciones que escribas se guardan en
          <span class="font-medium text-secondary-700">{{ activeAttributeName }}</span>
          y solo en este producto.
          <button type="button" class="text-primary hover:underline ml-1" @click="openAttributePicker">
            Cambiar
          </button>
        </p>

        <!-- Table -->
        <VariantTable
          :variants="variants"
          :images="props.images"
          :loading="isSaving"
          :igv-percent="props.igvPercent"
          :attribute-id="activeAttributeId"
          :attribute-name="activeAttributeName"
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

    <!-- Elegir a qué atributo se cuelgan las opciones escritas a mano -->
    <Dialog
      v-model:visible="showAttributePicker"
      header="¿Qué estás diferenciando?"
      :modal="true"
      :style="{ width: '440px' }"
    >
      <p class="text-sm text-secondary-500 mb-3">
        Las variantes de este producto se agrupan bajo un atributo (Talla, Color,
        Versión…). Elegí cuál, o creá uno nuevo. Las variantes que ya existen
        pasan a ese atributo conservando su nombre actual.
      </p>
      <Dropdown
        v-model="pickedAttributeId"
        :options="storeAttributes"
        optionLabel="name"
        optionValue="id"
        placeholder="Seleccionar atributo"
        class="w-full"
      />
      <template #footer>
        <div class="flex justify-between gap-2">
          <Button
            label="Crear atributo"
            icon="pi pi-plus"
            text
            size="small"
            @click="showCreateAttribute = true"
          />
          <div class="flex gap-2">
            <Button label="Cancelar" severity="secondary" outlined @click="showAttributePicker = false" />
            <Button label="Usar este" icon="pi pi-check" :disabled="!pickedAttributeId" @click="confirmAttribute" />
          </div>
        </div>
      </template>
    </Dialog>

    <AttributeCreateDialog
      v-model:visible="showCreateAttribute"
      context="variants"
      @created="onAttributeCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { productsApi } from '@/api/products.api'
import type {
  ProductVariant,
  ProductImage,
  GenerateVariantsPayload,
  SaveVariantsPayload,
} from '@/types/product.types'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import AttributeCreateDialog from '@/components/catalog/AttributeCreateDialog.vue'
import VariantAttributeSelector from './VariantAttributeSelector.vue'
import VariantTable from './VariantTable.vue'

const props = defineProps<{
  productId: number
  hasVariantsProp: boolean
  defaultPrice?: number
  images: ProductImage[]
  igvPercent?: number
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

/**
 * Atributo bajo el que se agrupan las variantes de ESTE producto.
 *
 * Hace falta para poder escribir la opción en la propia fila: el texto se
 * guarda como una opción ad-hoc colgada de este atributo y de este producto.
 * Se deduce, en orden: de los atributos que el API ya asocia al producto, de
 * los detalles de las variantes cargadas, y si no hay nada se le pregunta al
 * comerciante — las variantes que vienen del panel viejo no traen atributo.
 */
const activeAttributeId = ref(0)
const activeAttributeName = ref('')
const storeAttributes = ref<{ id: number; name: string }[]>([])
const showAttributePicker = ref(false)
const showCreateAttribute = ref(false)
const pickedAttributeId = ref<number | null>(null)

// Methods
async function loadExistingVariants() {
  isLoading.value = true
  try {
    const response = await productsApi.getVariants(props.productId)
    if (response.success && response.data) {
      variants.value = response.data.variants || []
      resolveActiveAttribute(response.data.attributes || [])
      // Auto-activate toggle if variants exist in DB
      if (variants.value.length > 0) {
        hasVariants.value = true
      }
    }
  } catch (err) {
    console.error('Error loading variants:', err)
  } finally {
    isLoading.value = false
  }
}

/**
 * De dónde sale el atributo bajo el que se agrupan las variantes.
 *
 * Primero el que el API ya asocia al producto. Si el puente está vacío —una
 * tienda que venía cargando todo desde el panel viejo no tiene ni una fila—
 * se busca en los detalles de las variantes. Si tampoco, queda en 0 y se le
 * pregunta al comerciante la primera vez que agregue o edite una.
 */
function resolveActiveAttribute(attributes: { id: number; name: string }[]) {
  if (attributes.length > 0) {
    activeAttributeId.value = attributes[0].id
    activeAttributeName.value = attributes[0].name
    return
  }

  for (const v of variants.value) {
    const detail = v.details.find(d => Number(d.store_attribute_id) > 0)
    if (detail) {
      activeAttributeId.value = Number(detail.store_attribute_id)
      activeAttributeName.value = detail.store_attribute_name || ''
      return
    }
  }

  activeAttributeId.value = 0
  activeAttributeName.value = ''
}

async function openAttributePicker() {
  pickedAttributeId.value = activeAttributeId.value || null

  if (storeAttributes.value.length === 0) {
    try {
      const response = await productsApi.getProductAttributes(props.productId)
      if (response.success && response.data) {
        storeAttributes.value = response.data.map((a: { id: number; name: string }) => ({
          id: a.id,
          name: a.name,
        }))
      }
    } catch (err) {
      console.error('Error loading attributes:', err)
    }
  }

  showAttributePicker.value = true
}

/**
 * Deja todas las variantes del producto colgando del atributo elegido.
 *
 * No alcanza con apuntar las nuevas: la ficha del storefront arma el selector
 * a partir de los atributos del producto, y una variante que no entra en ese
 * selector no aparece en ninguna combinación y no se puede comprar. O cruzan
 * todas o ninguna — el backend tiene la misma guarda y, si queda alguna
 * afuera, deja el producto con la lista plana de siempre.
 *
 * Las variantes que vienen del panel viejo no traen la opción en un formato que
 * este editor pueda expresar, pero sí su nombre ya resuelto: se usa ese texto,
 * así que el comprador ve exactamente lo mismo que antes.
 */
function applyAttribute(id: number, name: string) {
  activeAttributeId.value = id
  activeAttributeName.value = name

  for (const v of variants.value) {
    for (const d of v.details) {
      if (!Number(d.store_attribute_id)) {
        d.store_attribute_id = id
        d.store_attribute_name = name
      }
    }

    // Una sola opción: su nombre ES la opción, así que se puede sembrar.
    // Con dos o más (talla × color) el nombre es la combinación y no hay forma
    // de repartirlo, así que esas se dejan quietas.
    if (v.details.length === 1) {
      const detail = v.details[0]
      if (!Number(detail.option_id) && !(detail.option_text ?? '').trim()) {
        detail.option_text = (v.names ?? '').trim()
      }
    }
  }

  isDirty.value = true
}

function confirmAttribute() {
  if (!pickedAttributeId.value) return

  const attr = storeAttributes.value.find(a => a.id === pickedAttributeId.value)
  applyAttribute(pickedAttributeId.value, attr?.name ?? '')
  showAttributePicker.value = false
}

function onAttributeCreated(id: number, name: string) {
  storeAttributes.value.push({ id, name })
  applyAttribute(id, name)
  showAttributePicker.value = false
}

/**
 * Agrega una fila vacía para escribir la opción a mano.
 *
 * Es el camino que el panel viejo tenía y este editor no: hasta ahora la única
 * forma de crear una variante era el producto cartesiano del selector, que
 * obliga a dar de alta la opción antes en el catálogo de la tienda.
 */
async function handleAddVariant() {
  if (!activeAttributeId.value) {
    await openAttributePicker()
    return
  }

  variants.value.push({
    id: null,
    sku: '',
    barcode: null,
    names: '',
    price: props.defaultPrice ?? 0,
    cost: null,
    offer_price: null,
    stock: 0,
    unlimited_stock: false,
    image_id: null,
    image_url: null,
    details: [
      {
        store_attribute_id: activeAttributeId.value,
        store_attribute_name: activeAttributeName.value,
        option_id: 0,
        option_text: '',
        global_attribute_id: 0,
      },
    ],
  })

  isDirty.value = true
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

/**
 * Variantes que se quedarían sin ninguna opción, por posición (empezando en 1).
 *
 * Una variante sin talla ni color no se puede nombrar: en la tienda sale como
 * "Opción 1", "Opción 2" y el comprador no sabe qué está eligiendo.
 *
 * `option_id` 0 no basta para acusarla. Los productos antiguos guardan la opción
 * en un formato que el editor no sabe representar y llegan siempre con 0, pero
 * sí la tienen — y el guardado la conserva. Esas se reconocen porque traen
 * `names` resuelto por el servidor.
 */
function variantesSinOpcion(): number[] {
  const fallan: number[] = []
  variants.value.forEach((v, i) => {
    const tieneOpcion = v.details.some(
      d => Number(d.option_id) > 0
        || ((d.option_text ?? '').trim() !== '' && Number(d.store_attribute_id) > 0)
    )
    if (tieneOpcion) return
    if ((v.names ?? '').trim() !== '') return
    fallan.push(i + 1)
  })
  return fallan
}

async function handleSave() {
  const sinOpcion = variantesSinOpcion()
  if (sinOpcion.length > 0) {
    toast.add({
      severity: 'warn',
      summary: 'Falta la opción de algunas variantes',
      detail:
        `Sin talla o color, el comprador las verá como "Opción 1", "Opción 2". ` +
        `Complétalas: ${sinOpcion.map(n => `variante ${n}`).join(', ')}.`,
      life: 6000,
    })
    return
  }

  isSaving.value = true

  const payload: SaveVariantsPayload = {
    variants: variants.value.map(v => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode ?? null,
      price: v.price,
      cost: v.cost ?? null,
      offer_price: v.offer_price,
      stock: v.stock,
      unlimited_stock: v.unlimited_stock,
      image_id: v.image_id,
      details: v.details.map(d => ({
        store_attribute_id: d.store_attribute_id,
        option_id: d.option_id,
        // Solo cuando no hay id: el backend crea la opción a partir del texto.
        option_text: Number(d.option_id) > 0 ? undefined : (d.option_text ?? ''),
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
      detail:
        err.response?.data?.messages?.variants ||
        err.response?.data?.messages?.error ||
        'Error al guardar las variantes',
      life: 6000,
    })
  } finally {
    isSaving.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadExistingVariants()
})

// Sync toggle when prop changes (e.g., product data loads after mount)
watch(() => props.hasVariantsProp, (newVal) => {
  if (newVal && !hasVariants.value) {
    hasVariants.value = true
    if (variants.value.length === 0) {
      loadExistingVariants()
    }
  }
})
</script>
