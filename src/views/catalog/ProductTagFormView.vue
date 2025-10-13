<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Button icon="pi pi-arrow-left" text rounded @click="handleBack" />
            <div>
              <h1 class="text-2xl font-bold text-secondary">
                {{ editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta' }}
              </h1>
              <p class="text-sm text-secondary-500 mt-1">
                {{ editingTag ? `Editando: ${editingTag.nombre}` : 'Crear una nueva etiqueta para productos' }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button label="Cancelar" severity="secondary" outlined @click="handleBack" size="large" />
            <Button label="Guardar" icon="pi pi-check" :loading="tagsStore.isLoading" @click="saveTag" size="large" />
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Formulario -->
        <div>
          <Card>
            <template #title>
              <span class="text-lg">Configuración</span>
            </template>
            <template #content>
              <div class="space-y-6">
                <!-- Nombre -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Nombre <span class="text-red-500">*</span>
                  </label>
                  <InputText v-model="formData.nombre" placeholder="Ej: Oferta, Nuevo, Destacado" class="w-full" />
                  <small class="text-secondary-500">Nombre interno de la etiqueta</small>
                </div>

                <!-- Tipo -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Tipo <span class="text-red-500">*</span>
                  </label>
                  <SelectButton v-model="formData.tipo" :options="tipoOptions" optionLabel="label" optionValue="value"
                    class="w-full" />
                </div>

                <!-- Texto (solo si tipo es texto) -->
                <div v-if="formData.tipo === 'texto'">
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    Texto del ribbon <span class="text-red-500">*</span>
                  </label>
                  <InputText v-model="formData.texto" placeholder="Ej: -50%, NUEVO, OFERTA" class="w-full"
                    maxlength="100" />
                  <small class="text-secondary-500">Máximo 100 caracteres</small>
                </div>

                <!-- URL de imagen (solo si tipo es imagen) -->
                <div v-if="formData.tipo === 'imagen'">
                  <label class="block text-sm font-medium text-secondary-700 mb-2">
                    URL de la imagen <span class="text-red-500">*</span>
                  </label>
                  <InputText v-model="formData.imagen_url" placeholder="https://ejemplo.com/imagen.png"
                    class="w-full" />
                  <small class="text-secondary-500">URL completa de la imagen del ribbon</small>
                </div>

                <!-- Posición -->
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-3">
                    Posición <span class="text-red-500">*</span>
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <!-- Fila superior -->
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'top-left' }">
                      <input type="radio" v-model="formData.posicion" value="top-left" class="sr-only" />
                      <span>Sup. Izq.</span>
                    </label>
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'top-center' }">
                      <input type="radio" v-model="formData.posicion" value="top-center" class="sr-only" />
                      <span>Sup. Centro</span>
                    </label>
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'top-right' }">
                      <input type="radio" v-model="formData.posicion" value="top-right" class="sr-only" />
                      <span>Sup. Der.</span>
                    </label>

                    <!-- Fila media -->
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'center-left' }">
                      <input type="radio" v-model="formData.posicion" value="center-left" class="sr-only" />
                      <span>Med. Izq.</span>
                    </label>
                    <div class="h-10 border-2 border-dashed border-secondary-300 rounded flex items-center justify-center text-xs text-secondary-400">
                      Centro
                    </div>
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'center-right' }">
                      <input type="radio" v-model="formData.posicion" value="center-right" class="sr-only" />
                      <span>Med. Der.</span>
                    </label>

                    <!-- Fila inferior -->
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'bottom-left' }">
                      <input type="radio" v-model="formData.posicion" value="bottom-left" class="sr-only" />
                      <span>Inf. Izq.</span>
                    </label>
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'bottom-center' }">
                      <input type="radio" v-model="formData.posicion" value="bottom-center" class="sr-only" />
                      <span>Inf. Centro</span>
                    </label>
                    <label class="position-option" :class="{ 'position-selected': formData.posicion === 'bottom-right' }">
                      <input type="radio" v-model="formData.posicion" value="bottom-right" class="sr-only" />
                      <span>Inf. Der.</span>
                    </label>
                  </div>
                </div>

                <!-- Colores (solo para tipo texto) -->
                <div v-if="formData.tipo === 'texto'" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">
                      Color de fondo
                    </label>
                    <div class="flex gap-2 items-center">
                      <input type="color" v-model="formData.color_fondo" class="h-10 w-20 border border-secondary-300 rounded cursor-pointer" style="min-width: 5rem; padding: 2px;" />
                      <InputText v-model="formData.color_fondo" class="w-32" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">
                      Color del texto
                    </label>
                    <div class="flex gap-2 items-center">
                      <input type="color" v-model="formData.color_texto" class="h-10 w-20 border border-secondary-300 rounded cursor-pointer" style="min-width: 5rem; padding: 2px;" />
                      <InputText v-model="formData.color_texto" class="w-32" />
                    </div>
                  </div>
                </div>

                <Divider />

                <!-- Orden y Estado -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">
                      Orden
                    </label>
                    <InputNumber v-model="formData.orden" :min="0" class="w-full" />
                    <small class="text-secondary-500">Mayor número = más prioridad</small>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">
                      Estado
                    </label>
                    <div class="flex items-center h-full">
                      <InputSwitch v-model="formData.activo" />
                      <span class="ml-2">{{ formData.activo ? 'Activo' : 'Inactivo' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Vista Previa -->
        <div class="lg:sticky lg:top-8 h-fit">
          <Card>
            <template #title>
              <span class="text-lg">Vista Previa</span>
            </template>
            <template #content>
              <div class="aspect-square relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                <img src="https://picsum.photos/400" alt="Producto de ejemplo"
                  class="w-full h-full object-cover" />

                <!-- Ribbon preview -->
                <div v-if="showPreview" :class="['ribbon-preview', ribbonPositionClass]"
                  :style="ribbonStyles">
                  <span v-if="formData.tipo === 'texto'">{{ formData.texto || 'TEXTO' }}</span>
                  <img v-else-if="formData.imagen_url" :src="formData.imagen_url" alt="Preview"
                    class="max-h-16 max-w-full" @error="imageError = true" />
                  <span v-else class="text-xs text-gray-400">Sin imagen</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductTagsStore } from '@/stores/product-tags.store'
import type { ProductTag, ProductTagFormData, TagType, TagPosition } from '@/types/product-tag.types'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const tagsStore = useProductTagsStore()
const toast = useToast()

// State
const editingTag = ref<ProductTag | null>(null)
const imageError = ref(false)

const defaultFormData: ProductTagFormData = {
  nombre: '',
  tipo: 'texto',
  texto: '',
  imagen_url: '',
  posicion: 'top-right',
  color_fondo: '#ff0000',
  color_texto: '#ffffff',
  activo: true,
  orden: 0
}

const formData = reactive<ProductTagFormData>({ ...defaultFormData })

// Options
const tipoOptions = [
  { label: 'Texto', value: 'texto' as TagType },
  { label: 'Imagen', value: 'imagen' as TagType }
]

const posicionOptions = [
  { label: 'Superior Izquierda', shortLabel: 'Sup. Izq.', value: 'top-left' as TagPosition },
  { label: 'Centro Superior', shortLabel: 'Sup. Centro', value: 'top-center' as TagPosition },
  { label: 'Superior Derecha', shortLabel: 'Sup. Der.', value: 'top-right' as TagPosition },
  { label: 'Medio Izquierdo', shortLabel: 'Med. Izq.', value: 'center-left' as TagPosition },
  { label: 'Medio Derecho', shortLabel: 'Med. Der.', value: 'center-right' as TagPosition },
  { label: 'Inferior Izquierda', shortLabel: 'Inf. Izq.', value: 'bottom-left' as TagPosition },
  { label: 'Centro Inferior', shortLabel: 'Inf. Centro', value: 'bottom-center' as TagPosition },
  { label: 'Inferior Derecha', shortLabel: 'Inf. Der.', value: 'bottom-right' as TagPosition }
]

// Computed
const showPreview = computed(() => {
  if (formData.tipo === 'texto') {
    return formData.texto && formData.texto.trim().length > 0
  }
  return formData.imagen_url && formData.imagen_url.trim().length > 0 && !imageError.value
})

const ribbonPositionClass = computed(() => {
  const positionMap: Record<TagPosition, string> = {
    'top-left': 'ribbon-top-left',
    'top-center': 'ribbon-top-center',
    'top-right': 'ribbon-top-right',
    'center-left': 'ribbon-center-left',
    'center-right': 'ribbon-center-right',
    'bottom-left': 'ribbon-bottom-left',
    'bottom-center': 'ribbon-bottom-center',
    'bottom-right': 'ribbon-bottom-right'
  }
  return positionMap[formData.posicion]
})

const ribbonStyles = computed(() => {
  if (formData.tipo === 'texto') {
    return {
      backgroundColor: formData.color_fondo,
      color: formData.color_texto
    }
  }
  return {}
})

// Methods
function getPositionLabel(position: TagPosition): string {
  const option = posicionOptions.find(opt => opt.value === position)
  return option?.label || position
}

function handleBack() {
  router.push('/catalog/product-tags')
}

async function saveTag() {
  // Validaciones
  if (!formData.nombre.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El nombre es requerido',
      life: 3000
    })
    return
  }

  if (formData.tipo === 'texto' && !formData.texto?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El texto del ribbon es requerido',
      life: 3000
    })
    return
  }

  if (formData.tipo === 'imagen' && !formData.imagen_url?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'La URL de la imagen es requerida',
      life: 3000
    })
    return
  }

  let success = false

  if (editingTag.value) {
    success = await tagsStore.updateTag(editingTag.value.id, formData)
  } else {
    success = await tagsStore.createTag(formData)
  }

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: editingTag.value ? 'Etiqueta actualizada' : 'Etiqueta creada',
      life: 3000
    })
    router.push('/catalog/product-tags')
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: tagsStore.error || 'No se pudo guardar la etiqueta',
      life: 3000
    })
  }
}

// Watch para resetear error de imagen
watch(() => formData.imagen_url, () => {
  imageError.value = false
})

// Lifecycle
onMounted(async () => {
  const tagId = route.params.id
  if (tagId && tagId !== 'new') {
    await tagsStore.fetchTags()
    editingTag.value = tagsStore.getTagById(Number(tagId)) || null

    if (editingTag.value) {
      // Asignar propiedades individualmente para asegurar reactividad
      formData.nombre = editingTag.value.nombre
      formData.tipo = editingTag.value.tipo
      formData.texto = editingTag.value.texto || ''
      formData.imagen_url = editingTag.value.imagen_url || ''
      formData.posicion = editingTag.value.posicion as TagPosition
      formData.color_fondo = editingTag.value.color_fondo
      formData.color_texto = editingTag.value.color_texto
      formData.activo = editingTag.value.activo
      formData.orden = editingTag.value.orden
      console.log('Loaded tag - formData.posicion:', formData.posicion)
    }
  }
})
</script>

<style scoped>
.ribbon-preview {
  position: absolute;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 6px 12px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ribbon-top-left {
  top: 10px;
  left: 10px;
}

.ribbon-top-center {
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.ribbon-top-right {
  top: 10px;
  right: 10px;
}

.ribbon-center-left {
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
}

.ribbon-center-right {
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
}

.ribbon-bottom-left {
  bottom: 10px;
  left: 10px;
}

.ribbon-bottom-center {
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.ribbon-bottom-right {
  bottom: 10px;
  right: 10px;
}

/* Asegurar bordes en inputs */
:deep(.p-inputtext),
:deep(.p-inputnumber-input) {
  border: 1px solid #d1d5db !important;
}

/* Radio buttons personalizados para posición */
.position-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.5rem;
  border: 2px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;
  user-select: none;
}

.position-option:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.position-option.position-selected {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  font-weight: 600;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
