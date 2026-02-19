<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Atributos</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Gestiona los atributos de tus productos (color, talla, etc.)
        </p>
      </div>
      <Button label="Nuevo Atributo" icon="pi pi-plus" @click="showCreateDialog = true" />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading && !store.attributes.length" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
      <Button label="Reintentar" text size="small" class="ml-2" @click="store.fetchAttributes()" />
    </Message>

    <!-- Table -->
    <DataTable
      v-else-if="store.attributes.length > 0"
      :value="store.attributes"
      :loading="store.isLoading"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="name" header="Nombre" sortable>
        <template #body="{ data }">
          <router-link
            :to="`/catalog/attributes/${data.id}`"
            class="text-primary hover:underline font-medium"
          >
            {{ data.name }}
          </router-link>
        </template>
      </Column>

      <Column field="type" header="Tipo" sortable style="width: 150px">
        <template #body="{ data }">
          <Tag :value="getTypeLabel(data.type)" :severity="getTypeSeverity(data.type)" />
        </template>
      </Column>

      <Column field="style" header="Estilo" sortable style="width: 130px">
        <template #body="{ data }">
          {{ getStyleLabel(data.style) }}
        </template>
      </Column>

      <Column field="option_count" header="Opciones" sortable style="width: 120px">
        <template #body="{ data }">
          <span class="font-medium">{{ data.option_count }}</span>
        </template>
      </Column>

      <Column header="Acciones" style="width: 120px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              @click="router.push(`/catalog/attributes/${data.id}`)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-palette text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay atributos</h3>
      <p class="text-secondary-500 mb-4">
        Crea atributos como Color, Talla o Material para definir variantes de tus productos.
      </p>
      <Button label="Nuevo Atributo" icon="pi pi-plus" @click="showCreateDialog = true" />
    </div>

    <!-- Dialog: Crear Atributo -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Nuevo Atributo"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre</label>
          <InputText
            v-model="createForm.name"
            placeholder="Ej: Color, Talla, Material"
            class="w-full"
            :class="{ 'p-invalid': createErrors.name }"
          />
          <small v-if="createErrors.name" class="text-red-500">{{ createErrors.name }}</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo</label>
          <Dropdown
            v-model="createForm.type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar tipo"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Estilo de visualización</label>
          <div class="flex gap-4">
            <div class="flex items-center gap-2">
              <RadioButton v-model="createForm.style" :value="1" inputId="style-rect" />
              <label for="style-rect" class="text-sm">Rectangular</label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton v-model="createForm.style" :value="2" inputId="style-circle" />
              <label for="style-circle" class="text-sm">Circular</label>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">
            Opciones iniciales <span class="text-secondary-400">(opcional)</span>
          </label>
          <Chips
            v-model="createForm.options"
            placeholder="Escribe y presiona Enter"
            class="w-full"
          />
          <small class="text-secondary-400">Puedes agregar más opciones después</small>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" outlined @click="showCreateDialog = false" />
          <Button
            label="Crear Atributo"
            icon="pi pi-check"
            :loading="store.isLoading"
            @click="handleCreate"
          />
        </div>
      </template>
    </Dialog>

    <!-- Dialog: Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar eliminación"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="flex items-start gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
        <div>
          <p class="text-secondary-700 mb-2">
            ¿Estás seguro de que deseas eliminar el atributo
            <strong>{{ attributeToDelete?.name }}</strong>?
          </p>
          <p class="text-sm text-secondary-500">
            Esta acción eliminará el atributo y todas sus opciones.
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" outlined @click="showDeleteDialog = false" />
          <Button
            label="Eliminar"
            severity="danger"
            :loading="store.isLoading"
            @click="handleDelete"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAttributesStore } from '@/stores/attributes.store'
import type { StoreAttribute, AttributeType, AttributeStyle } from '@/types/attribute.types'
import { ATTRIBUTE_TYPE_LABELS, ATTRIBUTE_STYLE_LABELS } from '@/types/attribute.types'
import Button from 'primevue/button'
import Column from 'primevue/column'
import Chips from 'primevue/chips'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import RadioButton from 'primevue/radiobutton'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const store = useAttributesStore()
const toast = useToast()

// State
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const attributeToDelete = ref<StoreAttribute | null>(null)

const createForm = ref({
  name: '',
  type: 1 as AttributeType,
  style: 1 as AttributeStyle,
  options: [] as string[],
})

const createErrors = ref<Record<string, string>>({})

const typeOptions = [
  { label: 'Texto / Combo', value: 1 },
  { label: 'Color', value: 2 },
  { label: 'Botón', value: 3 },
  { label: 'Imagen', value: 4 },
]

// Methods
function getTypeLabel(type: AttributeType): string {
  return ATTRIBUTE_TYPE_LABELS[type] || 'Desconocido'
}

function getTypeSeverity(type: AttributeType): string {
  const map: Record<number, string> = { 1: 'info', 2: 'success', 3: 'warning', 4: 'secondary' }
  return map[type] || 'info'
}

function getStyleLabel(style: AttributeStyle): string {
  return ATTRIBUTE_STYLE_LABELS[style] || 'Rectangular'
}

function confirmDelete(attr: StoreAttribute) {
  attributeToDelete.value = attr
  showDeleteDialog.value = true
}

async function handleCreate() {
  createErrors.value = {}

  if (!createForm.value.name.trim()) {
    createErrors.value.name = 'El nombre es requerido'
    return
  }

  const id = await store.createAttribute({
    name: createForm.value.name.trim(),
    type: createForm.value.type,
    style: createForm.value.style,
    options: createForm.value.options,
  })

  if (id) {
    toast.add({
      severity: 'success',
      summary: 'Atributo creado',
      detail: `Se creó el atributo "${createForm.value.name}"`,
      life: 3000,
    })
    showCreateDialog.value = false
    createForm.value = { name: '', type: 1, style: 1, options: [] }
    router.push(`/catalog/attributes/${id}`)
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo crear el atributo',
      life: 5000,
    })
  }
}

async function handleDelete() {
  if (!attributeToDelete.value) return

  const success = await store.deleteAttribute(attributeToDelete.value.id)

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'Atributo eliminado correctamente',
      life: 3000,
    })
    showDeleteDialog.value = false
    attributeToDelete.value = null
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo eliminar el atributo',
      life: 5000,
    })
  }
}

// Lifecycle
onMounted(() => {
  store.fetchAttributes()
})
</script>
