<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Listas de Productos</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ productListStore.lists.length }} listas registradas
        </p>
      </div>
      <Button
        label="Nueva Lista"
        icon="pi pi-plus"
        @click="$router.push({ name: 'product-list-create' })"
      />
    </div>

    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-4 mb-6">
      <div class="flex-1">
        <SearchBar
          v-model="searchQuery"
          placeholder="Buscar listas..."
        />
      </div>
      <div class="w-full md:w-64">
        <Dropdown
          v-model="selectedTypeFilter"
          :options="typeOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Filtrar por tipo"
          showClear
          class="w-full"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="productListStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="productListStore.error" severity="error" :closable="false">
      {{ productListStore.error }}
    </Message>

    <!-- Tabla -->
    <div v-else-if="filteredLists.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="filteredLists"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="productolista_nombre" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ data.productolista_nombre }}</span>
          </template>
        </Column>

        <Column field="productolista_tipo" header="Tipo" sortable style="width: 160px">
          <template #body="{ data }">
            <Tag :value="getTypeName(data.productolista_tipo)" :severity="getTypeSeverity(data.productolista_tipo)" />
          </template>
        </Column>

        <Column field="productolista_estado" header="Estado" sortable style="width: 120px">
          <template #body="{ data }">
            <Tag
              :value="data.productolista_estado == 1 ? 'Activo' : 'Inactivo'"
              :severity="data.productolista_estado == 1 ? 'success' : 'secondary'"
            />
          </template>
        </Column>

        <Column field="product_count" header="Productos" sortable style="width: 120px">
          <template #body="{ data }">
            <Tag :value="`${data.product_count || 0} productos`" severity="secondary" />
          </template>
        </Column>

        <Column field="productolista_codigo" header="Código" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="text-secondary-500 font-mono text-sm">{{ data.productolista_codigo }}</span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 160px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                v-if="data.productolista_tipo == 1"
                icon="pi pi-link"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip="'Vincular productos'"
                @click="openLinkDialog(data)"
              />
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip="'Editar'"
                @click="$router.push({ name: 'product-list-edit', params: { id: data.productolista_id } })"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                v-tooltip="'Eliminar'"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-list text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay listas de productos</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery || selectedTypeFilter ? 'No se encontraron listas con ese criterio' : 'Comienza creando tu primera lista de productos' }}
      </p>
      <Button
        v-if="!searchQuery && !selectedTypeFilter"
        label="Nueva Lista"
        icon="pi pi-plus"
        @click="$router.push({ name: 'product-list-create' })"
      />
    </div>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la lista <strong>{{ listToDelete?.productolista_nombre }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Se eliminarán todas las vinculaciones de productos. Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteList"
        />
      </template>
    </Dialog>

    <!-- Dialog Vincular Productos -->
    <ProductLinkDialog
      v-model:visible="showLinkDialog"
      entity-type="product-list"
      :entity-id="listToLink?.productolista_id || 0"
      :entity-name="listToLink?.productolista_nombre || ''"
      @updated="onProductsUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductListStore } from '@/stores/product-list.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SearchBar from '@/components/common/SearchBar.vue'
import ProductLinkDialog from '@/components/catalog/ProductLinkDialog.vue'
import type { ProductList } from '@/types/product-list.types'
import { PRODUCT_LIST_TYPES } from '@/types/product-list.types'

const productListStore = useProductListStore()
const toast = useToast()

const searchQuery = ref('')
const selectedTypeFilter = ref<number | null>(null)
const showDeleteDialog = ref(false)
const listToDelete = ref<ProductList | null>(null)
const isDeleting = ref(false)
const showLinkDialog = ref(false)
const listToLink = ref<ProductList | null>(null)

const typeOptions = computed(() => {
  return [
    { id: null, name: 'Todos los tipos' },
    { id: 1, name: 'Manual' },
    { id: 2, name: 'Más Vendidos' },
    { id: 3, name: 'Nuevos Productos' }
  ]
})

const filteredLists = computed(() => {
  let result = productListStore.lists

  // Filter by type
  if (selectedTypeFilter.value) {
    result = result.filter(list => list.productolista_tipo == selectedTypeFilter.value)
  }

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(list =>
      list.productolista_nombre.toLowerCase().includes(query) ||
      list.productolista_codigo.toLowerCase().includes(query)
    )
  }

  return result
})

const getTypeName = (tipo: number): string => {
  return PRODUCT_LIST_TYPES[tipo] || 'Desconocido'
}

const getTypeSeverity = (tipo: number): string => {
  switch (tipo) {
    case 1: return 'info'
    case 2: return 'warning'
    case 3: return 'success'
    default: return 'secondary'
  }
}

const openLinkDialog = (list: ProductList) => {
  listToLink.value = list
  showLinkDialog.value = true
}

const onProductsUpdated = () => {
  productListStore.fetchAll()
}

const confirmDelete = (list: ProductList) => {
  listToDelete.value = list
  showDeleteDialog.value = true
}

const deleteList = async () => {
  if (!listToDelete.value) return

  try {
    isDeleting.value = true
    await productListStore.remove(listToDelete.value.productolista_id)

    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'La lista ha sido eliminada correctamente',
      life: 3000
    })

    showDeleteDialog.value = false
    listToDelete.value = null
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar la lista',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await productListStore.fetchAll()
})
</script>
