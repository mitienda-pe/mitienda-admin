<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Categorías</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ catalogStore.flatCategories.length }} categorías registradas
        </p>
      </div>
      <Button
        label="Nueva Categoría"
        icon="pi pi-plus"
        @click="$router.push({ name: 'category-create' })"
      />
    </div>

    <!-- Búsqueda -->
    <div class="mb-6">
      <SearchBar
        v-model="searchQuery"
        placeholder="Buscar categorías..."
      />
    </div>

    <!-- Loading -->
    <div v-if="catalogStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="catalogStore.error" severity="error" :closable="false">
      {{ catalogStore.error }}
    </Message>

    <!-- Lista de Categorías -->
    <div v-else-if="filteredCategories.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card v-for="category in filteredCategories" :key="category.id" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="space-y-3">
            <!-- Nombre -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-semibold text-secondary">{{ category.name }}</h3>
                <p class="text-sm text-secondary-400">{{ category.slug }}</p>
              </div>
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  severity="secondary"
                  @click="$router.push({ name: 'category-edit', params: { id: category.id } })"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click="confirmDelete(category)"
                />
              </div>
            </div>

            <!-- Parent -->
            <div v-if="category.parent_id && category.parent_id > 0" class="flex items-center gap-2 text-sm text-secondary-500">
              <i class="pi pi-folder"></i>
              <span>Subcategoría de: {{ getParentName(category.parent_id) }}</span>
            </div>

            <!-- Orden -->
            <div v-if="category.order !== undefined && category.order > 0" class="flex items-center gap-2 text-sm text-secondary-500">
              <i class="pi pi-sort-amount-up"></i>
              <span>Orden: {{ category.order }}</span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-inbox text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay categorías</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery ? 'No se encontraron categorías con ese criterio' : 'Comienza creando tu primera categoría' }}
      </p>
      <Button
        v-if="!searchQuery"
        label="Nueva Categoría"
        icon="pi pi-plus"
        @click="$router.push({ name: 'category-create' })"
      />
    </div>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la categoría <strong>{{ categoryToDelete?.name }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">
        Esta acción eliminará también las subcategorías. No se puede deshacer.
      </p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteCategory"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalog.store'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SearchBar from '@/components/common/SearchBar.vue'
import type { Category } from '@/types/product.types'

const catalogStore = useCatalogStore()
const toast = useToast()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const categoryToDelete = ref<Category | null>(null)
const isDeleting = ref(false)

const filteredCategories = computed(() => {
  if (!searchQuery.value) return catalogStore.flatCategories

  const query = searchQuery.value.toLowerCase()
  return catalogStore.flatCategories.filter(cat =>
    cat.name.toLowerCase().includes(query) ||
    cat.slug?.toLowerCase().includes(query)
  )
})

const getParentName = (parentId: number) => {
  const parent = catalogStore.flatCategories.find(cat => cat.id === parentId)
  return parent?.name || 'Sin nombre'
}

const confirmDelete = (category: Category) => {
  categoryToDelete.value = category
  showDeleteDialog.value = true
}

const deleteCategory = async () => {
  if (!categoryToDelete.value) return

  try {
    isDeleting.value = true
    await catalogStore.deleteCategory(categoryToDelete.value.id)

    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'La categoría ha sido eliminada correctamente',
      life: 3000
    })

    showDeleteDialog.value = false
    categoryToDelete.value = null
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar la categoría',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  if (catalogStore.flatCategories.length === 0) {
    await catalogStore.fetchCategories()
  }
})
</script>
