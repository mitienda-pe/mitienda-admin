<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="goBack" />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar visor 3D' : 'Nuevo visor 3D' }}
        </h1>
        <p v-if="productName" class="text-sm text-secondary-500 mt-1">{{ productName }}</p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <form v-else class="bg-white rounded-lg shadow p-6 space-y-6" @submit.prevent="save">
      <!-- Producto: solo al crear. Cambiarlo despues seria otro producto para
           el proveedor, y el modelo ya generado se perderia. -->
      <div v-if="!isEditMode">
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Producto <span class="text-red-500">*</span>
        </label>
        <AutoComplete
          v-model="selectedProduct"
          :suggestions="productOptions"
          option-label="producto_titulo"
          placeholder="Buscá por nombre o SKU"
          class="w-full"
          input-class="w-full"
          complete-on-focus
          @complete="searchProducts"
          @item-select="onProductSelected"
        />
        <small class="text-secondary-500">
          Solo aparecen productos con al menos una foto y que todavía no tengan visor.
        </small>
        <small v-if="errors.producto_id" class="text-red-500 block">{{ errors.producto_id }}</small>
      </div>

      <template v-if="formData.producto_id">
        <Divider />

        <!-- Fotos -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">
            Fotos del modelo <span class="text-red-500">*</span>
          </label>
          <p class="text-xs text-secondary-500 mb-3">
            Hasta {{ MAX_IMAGES }}. Elegí tomas del producto solo, sobre fondo limpio: con varias vistas
            el modelo sale mejor. <strong>Las fotos de ambiente, los planos de medidas y los primeros
            planos lo empeoran.</strong> La primera es la que ve el comprador mientras el modelo se genera.
          </p>

          <div v-if="gallery.length === 0" class="text-sm text-secondary-500">
            Este producto no tiene fotos disponibles.
          </div>

          <div v-else class="grid grid-cols-3 md:grid-cols-6 gap-3">
            <button
              v-for="image in gallery"
              :key="image.ref"
              type="button"
              class="relative aspect-square rounded border-2 overflow-hidden transition-all"
              :class="selectionIndex(image.ref) >= 0
                ? 'border-primary ring-1 ring-primary/30'
                : 'border-gray-200 hover:border-gray-300'"
              @click="toggleImage(image.ref)"
            >
              <img :src="image.url" :alt="''" class="w-full h-full object-cover" />
              <span
                v-if="selectionIndex(image.ref) >= 0"
                class="absolute top-1 right-1 w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold"
              >{{ selectionIndex(image.ref) + 1 }}</span>
            </button>
          </div>
          <small v-if="errors.images" class="text-red-500 block mt-2">{{ errors.images }}</small>
        </div>

        <Divider />

        <!-- Medidas -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">
            Medidas reales, en centímetros
          </label>
          <p class="text-xs text-secondary-500 mb-3">
            Son las del producto, no las de la caja. Definen el tamaño en realidad aumentada y
            se dibujan sobre el modelo.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="field in measureFields" :key="field.key">
              <label class="block text-xs text-secondary-600 mb-1">{{ field.label }}</label>
              <InputNumber
                v-model="formData[field.key]"
                :min="0"
                :max-fraction-digits="2"
                suffix=" cm"
                class="w-full"
                input-class="w-full"
                placeholder="—"
              />
            </div>
          </div>

          <!-- Las medidas de envio suelen estar mal (hay sillas de 0,72 "cm"),
               asi que se ofrecen para copiar pero nunca se aplican solas. -->
          <div v-if="shippingMeasures" class="mt-3 text-xs text-secondary-500">
            Medidas de envío cargadas en el producto:
            <strong>{{ shippingMeasures.label }}</strong>
            <Button
              label="Copiarlas"
              link
              size="small"
              class="!p-0 !ml-1 !text-xs"
              @click="useShippingMeasures"
            />
            <span class="block mt-1">Revisalas: las de envío miden la caja y a veces están en otra unidad.</span>
          </div>

          <div class="flex items-center gap-3 mt-4">
            <InputSwitch v-model="showDimensions" :disabled="!hasAllMeasures" />
            <span class="text-sm text-secondary-600">
              Mostrar las medidas sobre el modelo
              <span v-if="!hasAllMeasures" class="text-secondary-400">
                — necesita las tres cargadas
              </span>
            </span>
          </div>
        </div>

        <Divider />

        <!-- Categoria y estado -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Categoría</label>
            <Dropdown
              v-model="formData.kind"
              :options="kinds"
              option-label="label"
              option-value="value"
              class="w-full"
            />
            <small class="text-secondary-500">Define cómo se apoya el objeto en realidad aumentada.</small>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Estado</label>
            <div class="flex items-center gap-3">
              <InputSwitch v-model="isPublished" />
              <span class="text-secondary-600">{{ isPublished ? 'Publicado' : 'Borrador' }}</span>
            </div>
            <small class="text-secondary-500">
              En borrador no sale en la tienda y no consume ningún modelo.
            </small>
          </div>
        </div>
      </template>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button label="Cancelar" text severity="secondary" @click="goBack" />
        <AppButton
          :label="isEditMode ? 'Guardar cambios' : 'Crear visor'"
          type="submit"
          :loading="isSaving"
          :disabled="!formData.producto_id"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { AppButton } from '@/components/ui'
import { arWidgetApi } from '@/api/ar-widget.api'
import {
  AR_WIDGET_KINDS,
  AR_WIDGET_MAX_IMAGES,
  type ArWidgetFormData,
  type ArWidgetImageOption,
  type ArWidgetProductOption
} from '@/types/ar-widget.types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const MAX_IMAGES = AR_WIDGET_MAX_IMAGES
const kinds = AR_WIDGET_KINDS

const measureFields = [
  { key: 'width_cm' as const, label: 'Ancho' },
  { key: 'height_cm' as const, label: 'Alto' },
  { key: 'depth_cm' as const, label: 'Profundidad' }
]

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const gallery = ref<ArWidgetImageOption[]>([])
const productOptions = ref<ArWidgetProductOption[]>([])
const selectedProduct = ref<ArWidgetProductOption | string | null>(null)
const productName = ref('')

const formData = ref<ArWidgetFormData>({
  producto_id: null,
  status: 0,
  kind: 'other',
  width_cm: null,
  height_cm: null,
  depth_cm: null,
  show_dimensions: 1,
  images: []
})

const isEditMode = computed(() => !!route.params.id)
const widgetId = computed(() => (route.params.id ? Number(route.params.id) : null))

const isPublished = computed({
  get: () => formData.value.status === 1,
  set: (value: boolean) => { formData.value.status = value ? 1 : 0 }
})

const showDimensions = computed({
  get: () => formData.value.show_dimensions === 1,
  set: (value: boolean) => { formData.value.show_dimensions = value ? 1 : 0 }
})

const hasAllMeasures = computed(() =>
  !!formData.value.width_cm && !!formData.value.height_cm && !!formData.value.depth_cm
)

/** Posición de una foto en la selección: define el orden que viaja al proveedor. */
const selectionIndex = (ref_: string) => formData.value.images.indexOf(ref_)

const toggleImage = (ref_: string) => {
  const index = selectionIndex(ref_)
  if (index >= 0) {
    formData.value.images.splice(index, 1)
    return
  }
  if (formData.value.images.length >= MAX_IMAGES) {
    toast.add({
      severity: 'warn',
      summary: `Máximo ${MAX_IMAGES} fotos`,
      detail: 'Quitá una para elegir otra.',
      life: 3000
    })
    return
  }
  formData.value.images.push(ref_)
}

/** Medidas de envío del producto elegido, convertidas a cm para ofrecerlas. */
const shippingMeasures = ref<{ width: number; height: number; depth: number; label: string } | null>(null)

const TO_CM: Record<string, number> = {
  milimetros: 0.1, milimetro: 0.1, mm: 0.1,
  centimetros: 1, centimetro: 1, cm: 1,
  metros: 100, metro: 100, m: 100,
  pulgadas: 2.54, pulgada: 2.54
}

const buildShippingMeasures = (product: ArWidgetProductOption) => {
  const factor = TO_CM[(product.producto_undlongitud || 'centimetros').toLowerCase()] ?? 1
  const width = Number(product.producto_ancho) * factor
  const height = Number(product.producto_altura) * factor
  const depth = Number(product.producto_largo) * factor

  if (!width || !height || !depth) {
    shippingMeasures.value = null
    return
  }

  const round = (n: number) => Math.round(n * 100) / 100
  shippingMeasures.value = {
    width: round(width),
    height: round(height),
    depth: round(depth),
    label: `${round(width)} × ${round(height)} × ${round(depth)} cm`
  }
}

const useShippingMeasures = () => {
  if (!shippingMeasures.value) return
  formData.value.width_cm = shippingMeasures.value.width
  formData.value.height_cm = shippingMeasures.value.height
  formData.value.depth_cm = shippingMeasures.value.depth
}

const searchProducts = async (event: { query: string }) => {
  try {
    productOptions.value = await arWidgetApi.searchProducts(event.query)
  } catch {
    productOptions.value = []
  }
}

const onProductSelected = async (event: { value: ArWidgetProductOption }) => {
  const product = event.value
  formData.value.producto_id = product.producto_id
  formData.value.images = []
  productName.value = product.producto_titulo
  buildShippingMeasures(product)

  try {
    gallery.value = await arWidgetApi.productImages(product.producto_id)
    // La principal viene preseleccionada: es la que el proveedor valida con
    // mas rigor y la que ve el comprador mientras el modelo se genera.
    if (gallery.value[0]) formData.value.images = [gallery.value[0].ref]
  } catch {
    gallery.value = []
  }
}

const validate = (): boolean => {
  errors.value = {}
  if (!formData.value.producto_id) errors.value.producto_id = 'Elegí un producto'
  if (formData.value.images.length === 0) errors.value.images = 'Elegí al menos una foto'
  return Object.keys(errors.value).length === 0
}

const save = async () => {
  if (!validate()) return

  isSaving.value = true
  try {
    if (isEditMode.value && widgetId.value) {
      const result = await arWidgetApi.update(widgetId.value, formData.value)

      // La API frena el guardado cuando el cambio reconstruye el modelo: el
      // comerciante confirma el gasto antes de que ocurra, no despues.
      if (result.needsRebuildConfirm) {
        isSaving.value = false
        confirm.require({
          header: 'Esto genera un modelo nuevo',
          message: `${result.message} ¿Guardamos igual?`,
          acceptLabel: 'Guardar y generar',
          rejectLabel: 'Cancelar',
          accept: async () => {
            isSaving.value = true
            try {
              await arWidgetApi.update(widgetId.value!, formData.value, true)
              toast.add({ severity: 'success', summary: 'Visor actualizado', life: 3000 })
              router.push({ name: 'ar-widgets' })
            } catch {
              toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 5000 })
            } finally {
              isSaving.value = false
            }
          }
        })
        return
      }

      toast.add({ severity: 'success', summary: 'Visor actualizado', life: 3000 })
    } else {
      await arWidgetApi.create(formData.value)
      toast.add({ severity: 'success', summary: 'Visor creado', life: 3000 })
    }

    router.push({ name: 'ar-widgets' })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.response?.data?.messages?.error || error?.response?.data?.message || 'No se pudo guardar',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const goBack = () => router.push({ name: 'ar-widgets' })

const load = async () => {
  if (!widgetId.value) return
  isLoading.value = true
  try {
    const response = await arWidgetApi.getById(widgetId.value)
    const widget = response.data
    if (!widget) throw new Error('sin datos')
    formData.value = {
      producto_id: widget.producto_id,
      status: widget.status,
      kind: widget.kind,
      width_cm: widget.width_cm,
      height_cm: widget.height_cm,
      depth_cm: widget.depth_cm,
      show_dimensions: widget.show_dimensions,
      images: [...widget.images]
    }
    productName.value = widget.producto_titulo || ''
    gallery.value = widget.available_images ?? []
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el visor', life: 5000 })
    router.push({ name: 'ar-widgets' })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (isEditMode.value) load()
})
</script>
