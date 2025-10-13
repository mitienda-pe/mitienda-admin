<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-lg">Etiquetas (Ribbons)</span>
        <Button label="Asignar Etiquetas" icon="pi pi-tag" size="small" @click="showDialog = true" />
      </div>
    </template>
    <template #content>
      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <ProgressSpinner style="width: 50px; height: 50px" />
      </div>

      <!-- Lista de tags asignados -->
      <div v-else-if="assignedTags.length > 0" class="space-y-3">
        <div v-for="assignment in assignedTags" :key="assignment.assignment_id"
          class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
          <div class="flex items-center gap-3 flex-1">
            <!-- Preview del ribbon -->
            <div class="w-24 h-16 flex items-center justify-center border rounded bg-gray-50">
              <div v-if="assignment.tag.tipo === 'texto'" class="px-2 py-1 rounded text-xs font-semibold"
                :style="{ backgroundColor: assignment.tag.color_fondo, color: assignment.tag.color_texto }">
                {{ assignment.tag.texto }}
              </div>
              <img v-else-if="assignment.tag.imagen_url" :src="assignment.tag.imagen_url"
                :alt="assignment.tag.nombre" class="max-h-14 max-w-full" />
            </div>

            <!-- Información -->
            <div class="flex-1">
              <p class="font-medium text-secondary">{{ assignment.tag.nombre }}</p>
              <div class="flex gap-2 mt-1">
                <Tag :value="getPositionLabel(assignment.tag.posicion)" severity="info" class="text-xs" />
                <Tag v-if="assignment.prioridad > 0" :value="`Prioridad: ${assignment.prioridad}`" severity="warning"
                  class="text-xs" />
              </div>
              <div v-if="assignment.fecha_inicio || assignment.fecha_fin" class="text-xs text-secondary-500 mt-1">
                <span v-if="assignment.fecha_inicio">Desde: {{ formatDate(assignment.fecha_inicio) }}</span>
                <span v-if="assignment.fecha_fin" class="ml-2">Hasta: {{ formatDate(assignment.fecha_fin) }}</span>
              </div>
            </div>
          </div>

          <!-- Botón eliminar -->
          <Button icon="pi pi-trash" text rounded size="small" severity="danger"
            @click="confirmRemoveTag(assignment)" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8 text-secondary-500">
        <i class="pi pi-tag text-4xl mb-3 block"></i>
        <p>No hay etiquetas asignadas a este producto</p>
      </div>
    </template>
  </Card>

  <!-- Dialog de asignación -->
  <Dialog v-model:visible="showDialog" header="Asignar Etiquetas" :modal="true" :style="{ width: '700px' }">
    <div class="space-y-4">
      <!-- Advertencia de límite -->
      <Message v-if="assignedTags.length >= 8" severity="warn" :closable="false">
        Ya has alcanzado el límite máximo de 8 etiquetas por producto
      </Message>
      <Message v-else-if="assignedTags.length + selectedTagIds.length > 8" severity="warn" :closable="false">
        Solo puedes asignar {{ 8 - assignedTags.length }} etiqueta(s) más (máximo 8 por producto)
      </Message>

      <!-- Lista de tags disponibles -->
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Etiquetas disponibles ({{ assignedTags.length }}/8 asignadas)
        </label>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="tag in availableTags" :key="tag.id"
            class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
            <div class="flex items-center gap-3 flex-1">
              <!-- Preview -->
              <div class="w-20 h-14 flex items-center justify-center border rounded bg-white">
                <div v-if="tag.tipo === 'texto'" class="px-2 py-1 rounded text-xs font-semibold"
                  :style="{ backgroundColor: tag.color_fondo, color: tag.color_texto }">
                  {{ tag.texto }}
                </div>
                <img v-else-if="tag.imagen_url" :src="tag.imagen_url" :alt="tag.nombre" class="max-h-12 max-w-full" />
              </div>

              <!-- Info -->
              <div>
                <p class="font-medium text-secondary">{{ tag.nombre }}</p>
                <Tag :value="getPositionLabel(tag.posicion)" severity="info" class="text-xs mt-1" />
              </div>
            </div>

            <!-- Checkbox para seleccionar -->
            <Checkbox v-model="selectedTagIds" :value="tag.id" :binary="false"
              :disabled="assignedTags.length >= MAX_TAGS_PER_PRODUCT || (assignedTags.length + selectedTagIds.length >= MAX_TAGS_PER_PRODUCT && !selectedTagIds.includes(tag.id))" />
          </div>

          <!-- Empty state -->
          <div v-if="availableTags.length === 0" class="text-center py-8 text-secondary-500">
            <p>No hay etiquetas activas disponibles</p>
            <Button label="Crear etiqueta" icon="pi pi-plus" text class="mt-2" @click="goToTagsManagement" />
          </div>
        </div>
      </div>

      <!-- Opciones de asignación -->
      <div v-if="selectedTagIds.length > 0" class="border-t pt-4">
        <h4 class="text-sm font-medium text-secondary-700 mb-3">Opciones de asignación</h4>

        <div class="grid grid-cols-2 gap-4">
          <!-- Prioridad -->
          <div>
            <label class="block text-xs text-secondary-600 mb-1">Prioridad</label>
            <InputNumber v-model="assignmentOptions.prioridad" :min="0" :max="100" class="w-full" />
            <small class="text-secondary-500">Mayor número = mayor prioridad</small>
          </div>

          <!-- Fecha inicio -->
          <div>
            <label class="block text-xs text-secondary-600 mb-1">Fecha inicio (opcional)</label>
            <Calendar v-model="assignmentOptions.fecha_inicio" dateFormat="yy-mm-dd" showTime hourFormat="24"
              class="w-full" />
          </div>

          <!-- Fecha fin -->
          <div class="col-span-2">
            <label class="block text-xs text-secondary-600 mb-1">Fecha fin (opcional)</label>
            <Calendar v-model="assignmentOptions.fecha_fin" dateFormat="yy-mm-dd" showTime hourFormat="24"
              class="w-full" />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <span class="text-sm text-secondary-600">
          {{ selectedTagIds.length }} etiqueta(s) seleccionada(s)
        </span>
        <div class="flex gap-2">
          <Button label="Cancelar" severity="secondary" outlined @click="showDialog = false" />
          <Button label="Asignar" :disabled="selectedTagIds.length === 0" :loading="isLoading" @click="assignTags" />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- Dialog confirmar eliminación -->
  <Dialog v-model:visible="showRemoveDialog" header="Confirmar eliminación" :modal="true" :style="{ width: '450px' }">
    <div class="flex items-start gap-4">
      <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
      <div>
        <p class="text-secondary-700">
          ¿Deseas remover la etiqueta <strong>{{ tagToRemove?.tag.nombre }}</strong> de este producto?
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" outlined @click="showRemoveDialog = false" />
        <Button label="Remover" severity="danger" :loading="isLoading" @click="removeTag" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { productTagsApi } from '@/api/product-tags.api'
import { useProductTagsStore } from '@/stores/product-tags.store'
import type { ProductTagAssignment, ProductTagAssignmentFormData, TagPosition } from '@/types/product-tag.types'
import { MAX_TAGS_PER_PRODUCT } from '@/types/product-tag.types'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'

interface Props {
  productId: number
}

const props = defineProps<Props>()
const router = useRouter()
const toast = useToast()
const tagsStore = useProductTagsStore()

// State
const assignedTags = ref<ProductTagAssignment[]>([])
const isLoading = ref(false)
const showDialog = ref(false)
const showRemoveDialog = ref(false)
const selectedTagIds = ref<number[]>([])
const tagToRemove = ref<ProductTagAssignment | null>(null)

const assignmentOptions = ref({
  prioridad: 0,
  fecha_inicio: null as Date | null,
  fecha_fin: null as Date | null
})

// Computed
const availableTags = computed(() => {
  // Solo mostrar tags activos que no estén ya asignados
  const assignedIds = assignedTags.value.map(a => a.tag.id)
  return tagsStore.getActiveTags().filter(tag => !assignedIds.includes(tag.id))
})

// Methods
function getPositionLabel(position: TagPosition): string {
  const labels: Record<TagPosition, string> = {
    'top-left': 'Superior Izq.',
    'top-center': 'Centro Superior',
    'top-right': 'Superior Der.',
    'center-left': 'Medio Izq.',
    'center-right': 'Medio Der.',
    'bottom-left': 'Inferior Izq.',
    'bottom-center': 'Centro Inferior',
    'bottom-right': 'Inferior Der.'
  }
  return labels[position] || position
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

async function loadAssignedTags() {
  isLoading.value = true
  try {
    const response = await productTagsApi.getProductTags(props.productId)
    if (response.success && response.data) {
      assignedTags.value = response.data
    }
  } catch (error) {
    console.error('Error loading product tags:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las etiquetas del producto',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

async function assignTags() {
  if (selectedTagIds.value.length === 0) return

  // Validate max tags limit
  if (assignedTags.value.length + selectedTagIds.value.length > MAX_TAGS_PER_PRODUCT) {
    toast.add({
      severity: 'warn',
      summary: 'Límite alcanzado',
      detail: `Solo puedes asignar ${MAX_TAGS_PER_PRODUCT - assignedTags.value.length} etiqueta(s) más`,
      life: 3000
    })
    return
  }

  isLoading.value = true
  try {
    const tagsToAssign: ProductTagAssignmentFormData[] = selectedTagIds.value.map(tagId => ({
      tag_id: tagId,
      prioridad: assignmentOptions.value.prioridad,
      fecha_inicio: assignmentOptions.value.fecha_inicio
        ? assignmentOptions.value.fecha_inicio.toISOString().slice(0, 19).replace('T', ' ')
        : null,
      fecha_fin: assignmentOptions.value.fecha_fin
        ? assignmentOptions.value.fecha_fin.toISOString().slice(0, 19).replace('T', ' ')
        : null
    }))

    // Combine existing tags with new ones
    const allTags = [
      ...assignedTags.value.map(a => ({
        tag_id: a.tag.id,
        prioridad: a.prioridad,
        fecha_inicio: a.fecha_inicio,
        fecha_fin: a.fecha_fin
      })),
      ...tagsToAssign
    ]

    const response = await productTagsApi.assignProductTags(props.productId, allTags)

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Etiquetas asignadas correctamente',
        life: 3000
      })
      await loadAssignedTags()
      showDialog.value = false
      selectedTagIds.value = []
      assignmentOptions.value = { prioridad: 0, fecha_inicio: null, fecha_fin: null }
    }
  } catch (error) {
    console.error('Error assigning tags:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron asignar las etiquetas',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

function confirmRemoveTag(assignment: ProductTagAssignment) {
  tagToRemove.value = assignment
  showRemoveDialog.value = true
}

async function removeTag() {
  if (!tagToRemove.value) return

  isLoading.value = true
  try {
    const response = await productTagsApi.unassignProductTag(
      props.productId,
      tagToRemove.value.tag.id
    )

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Etiqueta removida correctamente',
        life: 3000
      })
      await loadAssignedTags()
      showRemoveDialog.value = false
      tagToRemove.value = null
    }
  } catch (error) {
    console.error('Error removing tag:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo remover la etiqueta',
      life: 3000
    })
  } finally {
    isLoading.value = false
  }
}

function goToTagsManagement() {
  router.push('/catalog/product-tags')
}

// Lifecycle
onMounted(() => {
  tagsStore.fetchTags()
  loadAssignedTags()
})

// Watch for product changes
watch(() => props.productId, () => {
  loadAssignedTags()
})
</script>
