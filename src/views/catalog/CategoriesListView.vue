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

    <!-- Árbol de Categorías -->
    <div v-else-if="treeNodes.length > 0" class="bg-white rounded-lg shadow">
      <TreeTable
        :value="filteredTreeNodes"
        :expandedKeys="expandedKeys"
        class="w-full"
        :pt="{
          table: { class: 'w-full' },
          column: { bodycell: { class: 'py-3 px-4' }, headercell: { class: 'py-3 px-4 bg-gray-50 font-semibold text-secondary-700' } }
        }"
      >
        <Column field="name" header="Nombre" expander class="w-1/2">
          <template #body="{ node }">
            <div class="flex items-center gap-2">
              <i class="pi pi-folder text-primary"></i>
              <span class="font-medium text-secondary">{{ node.data.name }}</span>
              <span v-if="node.children && node.children.length > 0" class="text-xs text-secondary-400">
                ({{ node.children.length }} sub)
              </span>
            </div>
          </template>
        </Column>
        <Column field="slug" header="Slug" class="w-1/4">
          <template #body="{ node }">
            <span class="text-sm text-secondary-500 font-mono">{{ node.data.slug }}</span>
          </template>
        </Column>
        <Column field="order" header="Orden" class="w-20 text-center">
          <template #body="{ node }">
            <span class="text-sm text-secondary-500">{{ node.data.order || '-' }}</span>
          </template>
        </Column>
        <Column header="Acciones" class="w-32 text-right">
          <template #body="{ node }">
            <div class="flex justify-end gap-1">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                @click="$router.push({ name: 'category-edit', params: { id: node.data.id } })"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-plus"
                text
                rounded
                size="small"
                severity="secondary"
                @click="$router.push({ name: 'category-create', query: { parent_id: node.data.id } })"
                v-tooltip.top="'Agregar subcategoría'"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="confirmDelete(node.data)"
                v-tooltip.top="'Eliminar'"
              />
            </div>
          </template>
        </Column>
      </TreeTable>
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
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import SearchBar from '@/components/common/SearchBar.vue'
import type { Category } from '@/types/product.types'

interface TreeNode {
  key: string
  data: Category
  children?: TreeNode[]
}

const catalogStore = useCatalogStore()
const toast = useToast()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const categoryToDelete = ref<Category | null>(null)
const isDeleting = ref(false)

// All nodes expanded by default
const expandedKeys = ref<Record<string, boolean>>({})

// Convert categories to TreeTable format
const convertToTreeNodes = (categories: Category[]): TreeNode[] => {
  return categories.map(cat => {
    const node: TreeNode = {
      key: String(cat.id),
      data: cat
    }
    if (cat.sub && cat.sub.length > 0) {
      node.children = convertToTreeNodes(cat.sub)
      // Expand all nodes by default
      expandedKeys.value[node.key] = true
    }
    return node
  })
}

const treeNodes = computed(() => {
  return convertToTreeNodes(catalogStore.categories)
})

// Filter tree nodes based on search
const filterTreeNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
  const result: TreeNode[] = []

  for (const node of nodes) {
    const matchesQuery =
      node.data.name.toLowerCase().includes(query) ||
      (node.data.slug?.toLowerCase().includes(query) ?? false)

    let filteredChildren: TreeNode[] = []
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTreeNodes(node.children, query)
    }

    // Include node if it matches or has matching children
    if (matchesQuery || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      })
    }
  }

  return result
}

const filteredTreeNodes = computed(() => {
  if (!searchQuery.value) return treeNodes.value
  return filterTreeNodes(treeNodes.value, searchQuery.value.toLowerCase())
})

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

<style scoped>
/* Ajustes para TreeTable */
:deep(.p-treetable) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.p-treetable-thead > tr > th) {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.p-treetable-tbody > tr) {
  border-bottom: 1px solid #f3f4f6;
}

:deep(.p-treetable-tbody > tr:hover) {
  background-color: #f9fafb;
}

:deep(.p-treetable-toggler) {
  margin-right: 0.5rem;
  color: var(--primary-500);
}
</style>
