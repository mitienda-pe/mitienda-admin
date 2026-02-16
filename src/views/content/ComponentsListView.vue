<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Bloques de Componentes</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ componentsStore.pagination.total }} componentes registrados
          <span class="text-secondary-400">(solo los de tipo HTML son editables)</span>
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="componentsStore.isLoading && !componentsStore.components.length" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="componentsStore.error" severity="error" :closable="false">
      {{ componentsStore.error }}
    </Message>

    <!-- Empty State -->
    <div
      v-else-if="!componentsStore.components.length"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <i class="pi pi-box text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay componentes</h3>
      <p class="text-secondary-500">No se encontraron bloques de componentes para esta tienda.</p>
    </div>

    <!-- DataTable -->
    <div v-else class="bg-white rounded-lg shadow">
      <DataTable
        :value="componentsStore.components"
        :lazy="true"
        :paginator="true"
        :rows="rows"
        :totalRecords="componentsStore.pagination.total"
        :loading="componentsStore.isLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage"
        @sort="onSort"
        removableSort
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="name" header="Nombre" :sortable="true" sortField="tiendacomponente_nombre">
          <template #body="{ data }">
            <div>
              <span class="font-medium text-secondary">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="code" header="Código" :sortable="true" sortField="tiendacomponente_codigo">
          <template #body="{ data }">
            <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ data.code }}</code>
          </template>
        </Column>

        <Column
          field="type_name"
          header="Tipo"
          :sortable="true"
          sortField="componentetipo_nombre"
        >
          <template #body="{ data }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="data.type_id === 2 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'"
            >
              <i :class="data.type_id === 2 ? 'pi pi-code' : 'pi pi-box'" class="mr-1 text-xs"></i>
              {{ data.type_name }}
            </span>
          </template>
        </Column>

        <Column
          field="active"
          header="Activo"
          :sortable="true"
          sortField="tiendacomponente_swactivo"
          style="width: 100px"
        >
          <template #body="{ data }">
            <InputSwitch
              :modelValue="data.active"
              @update:modelValue="handleToggleActive(data)"
            />
          </template>
        </Column>

        <Column
          field="created_at"
          header="Fecha"
          :sortable="true"
          sortField="tiendacomponente_fecharegistro"
          style="width: 150px"
        >
          <template #body="{ data }">
            <span class="text-sm text-secondary-500">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 100px">
          <template #body="{ data }">
            <Button
              v-if="data.type_id === 2"
              v-tooltip.top="'Editar HTML'"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              @click="$router.push({ name: 'component-edit', params: { id: data.id } })"
            />
            <span
              v-else
              class="text-xs text-secondary-400 italic"
            >Solo lectura</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComponentsStore } from '@/stores/components.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { StoreComponent } from '@/types/component.types'

const componentsStore = useComponentsStore()
const { formatDate } = useFormatters()
const toast = useToast()

const rows = ref(20)
const sortField = ref('tiendacomponente_fecharegistro')
const sortOrder = ref('DESC')

const loadData = (page = 1) => {
  componentsStore.fetchComponents({
    page,
    limit: rows.value,
    sort: sortField.value,
    order: sortOrder.value,
  })
}

const onPage = (event: DataTablePageEvent) => {
  rows.value = event.rows
  loadData(event.page + 1)
}

const onSort = (event: DataTableSortEvent) => {
  if (event.sortField) {
    sortField.value = event.sortField as string
    sortOrder.value = event.sortOrder === 1 ? 'ASC' : 'DESC'
    loadData(1)
  }
}

const handleToggleActive = async (component: StoreComponent) => {
  try {
    await componentsStore.toggleActive(component.id)
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: component.active ? 'Componente desactivado' : 'Componente activado',
      life: 3000,
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al cambiar estado',
      life: 5000,
    })
  }
}

onMounted(() => {
  loadData()
})
</script>
