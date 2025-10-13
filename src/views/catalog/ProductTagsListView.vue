<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Etiquetas de Productos</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ tagsStore.tags.length }} etiquetas registradas
        </p>
      </div>
      <Button label="Nueva Etiqueta" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Búsqueda -->
    <div class="mb-6">
      <IconField iconPosition="left">
        <InputIcon class="pi pi-search" />
        <InputText v-model="searchQuery" placeholder="Buscar etiquetas..." class="w-full" />
      </IconField>
    </div>

    <!-- Loading -->
    <div v-if="tagsStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="tagsStore.error" severity="error" :closable="false">
      {{ tagsStore.error }}
    </Message>

    <!-- Lista de Etiquetas -->
    <div v-else-if="filteredTags.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="tag in filteredTags" :key="tag.id" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="space-y-4">
            <!-- Header con acciones -->
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-secondary">{{ tag.nombre }}</h3>
                <p class="text-sm text-secondary-400">{{ tag.tipo === 'texto' ? 'Texto' : 'Imagen' }}</p>
              </div>
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" text rounded size="small" severity="secondary"
                  @click="editTag(tag)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger"
                  @click="confirmDelete(tag)" />
              </div>
            </div>

            <!-- Preview del ribbon -->
            <div class="border rounded-lg p-4 bg-gray-50 min-h-[100px] flex items-center justify-center">
              <div v-if="tag.tipo === 'texto'" class="px-4 py-2 rounded"
                :style="{ backgroundColor: tag.color_fondo, color: tag.color_texto }">
                {{ tag.texto || 'Texto de ejemplo' }}
              </div>
              <img v-else-if="tag.imagen_url" :src="tag.imagen_url" :alt="tag.nombre" class="max-h-20 max-w-full" />
              <span v-else class="text-gray-400">Sin imagen</span>
            </div>

            <!-- Detalles -->
            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-secondary-500">Posición:</span>
                <Tag :value="getPositionLabel(tag.posicion)" severity="info" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-secondary-500">Estado:</span>
                <Tag :value="tag.activo ? 'Activo' : 'Inactivo'"
                  :severity="tag.activo ? 'success' : 'secondary'" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-secondary-500">Orden:</span>
                <span class="font-medium">{{ tag.orden }}</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-tag text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay etiquetas</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery ? 'No se encontraron etiquetas con ese criterio' : 'Comienza creando tu primera etiqueta' }}
      </p>
      <Button v-if="!searchQuery" label="Nueva Etiqueta" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Dialog Crear/Editar -->
    <Dialog v-model:visible="showDialog" :header="editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'" :modal="true"
      :style="{ width: '600px' }">
      <div class="space-y-4">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText v-model="formData.nombre" placeholder="Ej: Oferta, Nuevo, Destacado" class="w-full" />
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
        </div>

        <!-- URL de imagen (solo si tipo es imagen) -->
        <div v-if="formData.tipo === 'imagen'">
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            URL de la imagen <span class="text-red-500">*</span>
          </label>
          <InputText v-model="formData.imagen_url" placeholder="https://ejemplo.com/imagen.png" class="w-full" />
        </div>

        <!-- Posición -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Posición <span class="text-red-500">*</span>
          </label>
          <Dropdown v-model="formData.posicion" :options="posicionOptions" optionLabel="label" optionValue="value"
            placeholder="Seleccionar posición" class="w-full" />
        </div>

        <!-- Colores (solo para tipo texto) -->
        <div v-if="formData.tipo === 'texto'" class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Color de fondo
            </label>
            <ColorPicker v-model="formData.color_fondo" format="hex" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Color del texto
            </label>
            <ColorPicker v-model="formData.color_texto" format="hex" class="w-full" />
          </div>
        </div>

        <!-- Orden y Estado -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Orden
            </label>
            <InputNumber v-model="formData.orden" :min="0" class="w-full" />
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

        <!-- Preview -->
        <div v-if="formData.tipo === 'texto' && formData.texto">
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Vista previa
          </label>
          <div class="border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[80px]">
            <div class="px-4 py-2 rounded font-semibold"
              :style="{ backgroundColor: formData.color_fondo, color: formData.color_texto }">
              {{ formData.texto }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" outlined @click="showDialog = false" />
          <Button :label="editingTag ? 'Actualizar' : 'Crear'" :loading="tagsStore.isLoading" @click="saveTag" />
        </div>
      </template>
    </Dialog>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog v-model:visible="showDeleteDialog" header="Confirmar eliminación" :modal="true" :style="{ width: '450px' }">
      <div class="flex items-start gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
        <div>
          <p class="text-secondary-700 mb-2">
            ¿Estás seguro de que deseas eliminar la etiqueta <strong>{{ tagToDelete?.nombre }}</strong>?
          </p>
          <p class="text-sm text-secondary-500">
            Esta acción también eliminará todas las asignaciones de esta etiqueta a productos.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" outlined @click="showDeleteDialog = false" />
          <Button label="Eliminar" severity="danger" :loading="tagsStore.isLoading" @click="deleteTag" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductTagsStore } from '@/stores/product-tags.store'
import type { ProductTag, ProductTagFormData, TagType, TagPosition } from '@/types/product-tag.types'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import ColorPicker from 'primevue/colorpicker'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'

const tagsStore = useProductTagsStore()
const toast = useToast()

// State
const searchQuery = ref('')
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const editingTag = ref<ProductTag | null>(null)
const tagToDelete = ref<ProductTag | null>(null)

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

const formData = ref<ProductTagFormData>({ ...defaultFormData })

// Options
const tipoOptions = [
  { label: 'Texto', value: 'texto' as TagType },
  { label: 'Imagen', value: 'imagen' as TagType }
]

const posicionOptions = [
  { label: 'Superior Izquierda', value: 'top-left' as TagPosition },
  { label: 'Superior Derecha', value: 'top-right' as TagPosition },
  { label: 'Inferior Izquierda', value: 'bottom-left' as TagPosition },
  { label: 'Inferior Derecha', value: 'bottom-right' as TagPosition },
  { label: 'Centro', value: 'center' as TagPosition }
]

// Computed
const filteredTags = computed(() => {
  if (!searchQuery.value) return tagsStore.tags

  const query = searchQuery.value.toLowerCase()
  return tagsStore.tags.filter(tag =>
    tag.nombre.toLowerCase().includes(query) ||
    tag.texto?.toLowerCase().includes(query)
  )
})

// Methods
function getPositionLabel(position: TagPosition): string {
  const option = posicionOptions.find(opt => opt.value === position)
  return option?.label || position
}

function openCreateDialog() {
  editingTag.value = null
  formData.value = { ...defaultFormData }
  showDialog.value = true
}

function editTag(tag: ProductTag) {
  editingTag.value = tag
  formData.value = {
    nombre: tag.nombre,
    tipo: tag.tipo,
    texto: tag.texto || '',
    imagen_url: tag.imagen_url || '',
    posicion: tag.posicion,
    color_fondo: tag.color_fondo,
    color_texto: tag.color_texto,
    activo: tag.activo,
    orden: tag.orden
  }
  showDialog.value = true
}

async function saveTag() {
  // Validaciones
  if (!formData.value.nombre.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El nombre es requerido',
      life: 3000
    })
    return
  }

  if (formData.value.tipo === 'texto' && !formData.value.texto?.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El texto del ribbon es requerido',
      life: 3000
    })
    return
  }

  if (formData.value.tipo === 'imagen' && !formData.value.imagen_url?.trim()) {
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
    success = await tagsStore.updateTag(editingTag.value.id, formData.value)
  } else {
    success = await tagsStore.createTag(formData.value)
  }

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: editingTag.value ? 'Etiqueta actualizada' : 'Etiqueta creada',
      life: 3000
    })
    showDialog.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: tagsStore.error || 'No se pudo guardar la etiqueta',
      life: 3000
    })
  }
}

function confirmDelete(tag: ProductTag) {
  tagToDelete.value = tag
  showDeleteDialog.value = true
}

async function deleteTag() {
  if (!tagToDelete.value) return

  const success = await tagsStore.deleteTag(tagToDelete.value.id)

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Etiqueta eliminada',
      life: 3000
    })
    showDeleteDialog.value = false
    tagToDelete.value = null
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: tagsStore.error || 'No se pudo eliminar la etiqueta',
      life: 3000
    })
  }
}

// Lifecycle
onMounted(() => {
  tagsStore.fetchTags()
})
</script>
