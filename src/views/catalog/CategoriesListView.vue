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
        v-model:expandedKeys="expandedKeys"
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
        <Column field="product_count" header="Productos" class="w-24 text-center">
          <template #body="{ node }">
            <span
              class="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full"
              :class="node.data.product_count > 0 ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-secondary-400'"
            >
              {{ node.data.product_count || 0 }}
            </span>
          </template>
        </Column>
        <Column header="Acciones" class="w-40 text-right">
          <template #body="{ node }">
            <div class="flex justify-end gap-1">
              <Button
                icon="pi pi-link"
                text
                rounded
                size="small"
                severity="secondary"
                @click="openLinkDialog(node.data)"
                v-tooltip.top="'Vincular productos'"
              />
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

    <!-- Dialog Vincular Productos -->
    <ProductLinkDialog
      v-model:visible="showLinkDialog"
      entity-type="category"
      :entity-id="categoryToLink?.id || 0"
      :entity-name="categoryToLink?.name || ''"
      @updated="onProductsUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCatalogStore } from '@/stores/catalog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import SearchBar from '@/components/common/SearchBar.vue'
import ProductLinkDialog from '@/components/catalog/ProductLinkDialog.vue'
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

// Link products dialog
const showLinkDialog = ref(false)
const categoryToLink = ref<Category | null>(null)

// All nodes expanded by default
const expandedKeys = ref<Record<string, boolean>>({})

// Convert categories to TreeTable format (pure function, no side effects)
const convertToTreeNodes = (categories: Category[]): TreeNode[] => {
  return categories.map(cat => {
    const node: TreeNode = {
      key: String(cat.id),
      data: cat
    }
    if (cat.sub && cat.sub.length > 0) {
      node.children = convertToTreeNodes(cat.sub)
    }
    return node
  })
}

// Collect all keys for expanding (separate function)
const collectAllKeys = (nodes: TreeNode[]): Record<string, boolean> => {
  const keys: Record<string, boolean> = {}
  const collect = (items: TreeNode[]) => {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        keys[item.key] = true
        collect(item.children)
      }
    }
  }
  collect(nodes)
  return keys
}

const treeNodes = computed(() => {
  return convertToTreeNodes(catalogStore.categories)
})

// Watch for tree changes and set expanded keys
watch(treeNodes, (nodes) => {
  if (nodes.length > 0 && Object.keys(expandedKeys.value).length === 0) {
    expandedKeys.value = collectAllKeys(nodes)
  }
}, { immediate: true })

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

const openLinkDialog = (category: Category) => {
  categoryToLink.value = category
  showLinkDialog.value = true
}

const onProductsUpdated = () => {
  // Refresh categories to update product counts
  catalogStore.fetchCategories()
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

/* Toggler button styling */
:deep(.p-treetable-toggler) {
  margin-right: 0.5rem;
  color: var(--primary-500);
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Ensure proper indentation for nested rows */
:deep(.p-treetable-tbody td:first-child) {
  display: flex;
  align-items: center;
}

/* Child row indentation - each level gets more padding */
:deep(.p-treetable-tbody tr[aria-level="2"] td:first-child) {
  padding-left: 2rem !important;
}

:deep(.p-treetable-tbody tr[aria-level="3"] td:first-child) {
  padding-left: 3.5rem !important;
}

:deep(.p-treetable-tbody tr[aria-level="4"] td:first-child) {
  padding-left: 5rem !important;
}
</style>
