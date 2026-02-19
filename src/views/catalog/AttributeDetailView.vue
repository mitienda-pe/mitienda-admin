<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" text rounded @click="router.push('/catalog/attributes')" />
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-secondary">
          {{ store.currentAttribute?.name || 'Atributo' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          Edita el atributo y gestiona sus opciones
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading && !store.currentAttribute" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error && !store.currentAttribute" severity="error" :closable="false">
      {{ store.error }}
      <Button label="Reintentar" text size="small" class="ml-2" @click="loadAttribute" />
    </Message>

    <!-- Content -->
    <div v-else-if="store.currentAttribute" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Attribute Settings -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 class="text-lg font-semibold text-secondary">Configuración</h2>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre</label>
            <InputText v-model="editForm.name" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo</label>
            <Dropdown
              v-model="editForm.type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Estilo</label>
            <div class="flex gap-4">
              <div class="flex items-center gap-2">
                <RadioButton v-model="editForm.style" :value="1" inputId="edit-style-rect" />
                <label for="edit-style-rect" class="text-sm">Rectangular</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton v-model="editForm.style" :value="2" inputId="edit-style-circle" />
                <label for="edit-style-circle" class="text-sm">Circular</label>
              </div>
            </div>
          </div>

          <Button
            label="Guardar Cambios"
            icon="pi pi-check"
            class="w-full"
            :loading="isSaving"
            :disabled="!hasChanges"
            @click="handleSave"
          />
        </div>
      </div>

      <!-- Right: Options -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-secondary">
              Opciones
              <span class="text-secondary-400 font-normal">
                ({{ store.currentAttribute.options?.length || 0 }})
              </span>
            </h2>
          </div>

          <!-- Add Option -->
          <div class="flex gap-2 mb-4">
            <InputText
              v-model="newOptionText"
              placeholder="Nueva opción (ej: Rojo, S, Algodón...)"
              class="flex-1"
              @keyup.enter="handleAddOption"
            />
            <Button
              label="Agregar"
              icon="pi pi-plus"
              :disabled="!newOptionText.trim()"
              :loading="isAddingOption"
              @click="handleAddOption"
            />
          </div>

          <!-- Options List -->
          <div
            v-if="store.currentAttribute.options && store.currentAttribute.options.length > 0"
            class="space-y-2"
          >
            <div
              v-for="option in store.currentAttribute.options"
              :key="option.id"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
            >
              <!-- Color Preview (for color type) -->
              <div
                v-if="store.currentAttribute.type === 2"
                class="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
                :style="{ backgroundColor: option.text }"
              ></div>

              <!-- Option Text or Edit Input -->
              <div class="flex-1">
                <InputText
                  v-if="editingOptionId === option.id"
                  v-model="editingOptionText"
                  class="w-full p-inputtext-sm"
                  @keyup.enter="handleUpdateOption(option.id)"
                  @keyup.escape="cancelEditOption"
                />
                <span v-else class="text-secondary-700">{{ option.text }}</span>
              </div>

              <!-- Actions -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <template v-if="editingOptionId === option.id">
                  <Button
                    icon="pi pi-check"
                    text
                    rounded
                    size="small"
                    severity="success"
                    @click="handleUpdateOption(option.id)"
                  />
                  <Button
                    icon="pi pi-times"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    @click="cancelEditOption"
                  />
                </template>
                <template v-else>
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    @click="startEditOption(option)"
                  />
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    size="small"
                    severity="danger"
                    @click="handleDeleteOption(option.id)"
                  />
                </template>
              </div>
            </div>
          </div>

          <!-- Empty Options -->
          <div v-else class="text-center py-8 text-secondary-400">
            <i class="pi pi-list text-4xl mb-2"></i>
            <p>No hay opciones definidas. Agrega la primera opción arriba.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAttributesStore } from '@/stores/attributes.store'
import type { AttributeOption, AttributeType, AttributeStyle } from '@/types/attribute.types'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import RadioButton from 'primevue/radiobutton'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const store = useAttributesStore()
const toast = useToast()

// State
const isSaving = ref(false)
const isAddingOption = ref(false)
const newOptionText = ref('')
const editingOptionId = ref<number | null>(null)
const editingOptionText = ref('')

const editForm = ref({
  name: '',
  type: 1 as AttributeType,
  style: 1 as AttributeStyle,
})

const typeOptions = [
  { label: 'Texto / Combo', value: 1 },
  { label: 'Color', value: 2 },
  { label: 'Botón', value: 3 },
  { label: 'Imagen', value: 4 },
]

// Computed
const hasChanges = computed(() => {
  if (!store.currentAttribute) return false
  return (
    editForm.value.name !== store.currentAttribute.name ||
    editForm.value.type !== store.currentAttribute.type ||
    editForm.value.style !== store.currentAttribute.style
  )
})

// Methods
function loadAttribute() {
  const id = Number(route.params.id)
  if (id) {
    store.fetchAttribute(id)
  }
}

function syncForm() {
  if (store.currentAttribute) {
    editForm.value = {
      name: store.currentAttribute.name,
      type: store.currentAttribute.type,
      style: store.currentAttribute.style,
    }
  }
}

async function handleSave() {
  if (!store.currentAttribute) return
  isSaving.value = true

  const payload: Record<string, any> = {}
  if (editForm.value.name !== store.currentAttribute.name) {
    payload.name = editForm.value.name
  }
  if (editForm.value.type !== store.currentAttribute.type) {
    payload.type = editForm.value.type
  }
  if (editForm.value.style !== store.currentAttribute.style) {
    payload.style = editForm.value.style
  }

  const success = await store.updateAttribute(store.currentAttribute.id, payload)
  isSaving.value = false

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Atributo actualizado correctamente',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo actualizar el atributo',
      life: 5000,
    })
  }
}

async function handleAddOption() {
  if (!store.currentAttribute || !newOptionText.value.trim()) return
  isAddingOption.value = true

  const success = await store.addOption(store.currentAttribute.id, newOptionText.value.trim())
  isAddingOption.value = false

  if (success) {
    newOptionText.value = ''
    toast.add({
      severity: 'success',
      summary: 'Opción agregada',
      life: 2000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo agregar la opción',
      life: 5000,
    })
  }
}

function startEditOption(option: AttributeOption) {
  editingOptionId.value = option.id
  editingOptionText.value = option.text
}

function cancelEditOption() {
  editingOptionId.value = null
  editingOptionText.value = ''
}

async function handleUpdateOption(optionId: number) {
  if (!store.currentAttribute || !editingOptionText.value.trim()) return

  const success = await store.updateOption(
    store.currentAttribute.id,
    optionId,
    editingOptionText.value.trim()
  )

  if (success) {
    cancelEditOption()
    toast.add({ severity: 'success', summary: 'Opción actualizada', life: 2000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo actualizar la opción',
      life: 5000,
    })
  }
}

async function handleDeleteOption(optionId: number) {
  if (!store.currentAttribute) return

  const success = await store.removeOption(store.currentAttribute.id, optionId)

  if (success) {
    toast.add({ severity: 'success', summary: 'Opción eliminada', life: 2000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo eliminar la opción',
      life: 5000,
    })
  }
}

// Watchers
watch(() => store.currentAttribute, syncForm, { immediate: true })

// Lifecycle
onMounted(() => {
  loadAttribute()
})
</script>
