<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Gammas</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ gammaStore.gammas.length }} gammas registradas
        </p>
      </div>
      <Button
        label="Nueva Gamma"
        icon="pi pi-plus"
        @click="$router.push({ name: 'gamma-create' })"
      />
    </div>

    <!-- Filtros -->
    <div class="flex flex-col md:flex-row gap-4 mb-6">
      <div class="flex-1">
        <SearchBar
          v-model="searchQuery"
          placeholder="Buscar gammas..."
        />
      </div>
      <div class="w-full md:w-64">
        <Dropdown
          v-model="selectedBrandFilter"
          :options="brandOptions"
          optionLabel="name"
          optionValue="id"
          placeholder="Filtrar por marca"
          showClear
          class="w-full"
          @change="onBrandFilterChange"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="gammaStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="gammaStore.error" severity="error" :closable="false">
      {{ gammaStore.error }}
    </Message>

    <!-- Tabla de Gammas -->
    <div v-else-if="filteredGammas.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="filteredGammas"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="tiendagamma_nombre" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ data.tiendagamma_nombre }}</span>
          </template>
        </Column>

        <Column field="marca_nombre" header="Marca" sortable>
          <template #body="{ data }">
            <Tag :value="data.marca_nombre || 'Sin marca'" severity="info" />
          </template>
        </Column>

        <Column field="tiendagamma_swpublicado" header="Estado" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.tiendagamma_swpublicado == 1 ? 'Activo' : 'Inactivo'"
              :severity="data.tiendagamma_swpublicado == 1 ? 'success' : 'secondary'"
            />
          </template>
        </Column>

        <Column field="tiendagamma_orden" header="Orden" sortable style="width: 100px">
          <template #body="{ data }">
            <span class="text-secondary-500">{{ data.tiendagamma_orden }}</span>
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
                v-tooltip="'Editar'"
                @click="$router.push({ name: 'gamma-edit', params: { id: data.tiendagamma_id } })"
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
      <i class="pi pi-inbox text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay gammas</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery || selectedBrandFilter ? 'No se encontraron gammas con ese criterio' : 'Comienza creando tu primera gamma' }}
      </p>
      <Button
        v-if="!searchQuery && !selectedBrandFilter"
        label="Nueva Gamma"
        icon="pi pi-plus"
        @click="$router.push({ name: 'gamma-create' })"
      />
    </div>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la gamma <strong>{{ gammaToDelete?.tiendagamma_nombre }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteGamma"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGammaStore } from '@/stores/gamma.store'
import { useCatalogStore } from '@/stores/catalog.store'
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
import type { Gamma } from '@/types/gamma.types'

const gammaStore = useGammaStore()
const catalogStore = useCatalogStore()
const toast = useToast()

const searchQuery = ref('')
const selectedBrandFilter = ref<number | null>(null)
const showDeleteDialog = ref(false)
const gammaToDelete = ref<Gamma | null>(null)
const isDeleting = ref(false)

const brandOptions = computed(() => {
  return [
    { id: null, name: 'Todas las marcas' },
    ...catalogStore.brands
  ]
})

const filteredGammas = computed(() => {
  let result = gammaStore.gammas

  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(gamma =>
      gamma.tiendagamma_nombre.toLowerCase().includes(query) ||
      gamma.marca_nombre?.toLowerCase().includes(query)
    )
  }

  return result
})

const onBrandFilterChange = async () => {
  await gammaStore.fetchAll(selectedBrandFilter.value || undefined)
}

const confirmDelete = (gamma: Gamma) => {
  gammaToDelete.value = gamma
  showDeleteDialog.value = true
}

const deleteGamma = async () => {
  if (!gammaToDelete.value) return

  try {
    isDeleting.value = true
    await gammaStore.remove(gammaToDelete.value.tiendagamma_id)

    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'La gamma ha sido eliminada correctamente',
      life: 3000
    })

    showDeleteDialog.value = false
    gammaToDelete.value = null
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar la gamma',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  // Cargar marcas para el filtro
  if (catalogStore.brands.length === 0) {
    await catalogStore.fetchBrands()
  }

  // Cargar gammas
  await gammaStore.fetchAll()
})
</script>
