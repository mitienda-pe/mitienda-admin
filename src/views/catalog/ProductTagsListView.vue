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
      <Button label="Nueva Etiqueta" icon="pi pi-plus" @click="router.push('/catalog/product-tags/new')" />
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
                  @click="router.push(`/catalog/product-tags/${tag.id}`)" />
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
      <Button v-if="!searchQuery" label="Nueva Etiqueta" icon="pi pi-plus" @click="router.push('/catalog/product-tags/new')" />
    </div>

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
import { useRouter } from 'vue-router'
import { useProductTagsStore } from '@/stores/product-tags.store'
import type { ProductTag, TagPosition } from '@/types/product-tag.types'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const tagsStore = useProductTagsStore()
const toast = useToast()

// State
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const tagToDelete = ref<ProductTag | null>(null)

const posicionOptions = [
  { label: 'Superior Izquierda', value: 'top-left' as TagPosition },
  { label: 'Centro Superior', value: 'top-center' as TagPosition },
  { label: 'Superior Derecha', value: 'top-right' as TagPosition },
  { label: 'Medio Izquierdo', value: 'center-left' as TagPosition },
  { label: 'Medio Derecho', value: 'center-right' as TagPosition },
  { label: 'Inferior Izquierda', value: 'bottom-left' as TagPosition },
  { label: 'Centro Inferior', value: 'bottom-center' as TagPosition },
  { label: 'Inferior Derecha', value: 'bottom-right' as TagPosition }
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
