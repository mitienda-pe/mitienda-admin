<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Combos</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Paquetes de productos con precio especial
        </p>
      </div>
      <Button
        label="Nuevo Combo"
        icon="pi pi-plus"
        @click="router.push({ name: 'marketing-combo-create' })"
      />
    </div>

    <!-- Search -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <span class="p-input-icon-left flex-1">
          <i class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Buscar por nombre..."
            class="w-full"
            @keyup.enter="handleSearch"
          />
        </span>
        <Button
          label="Buscar"
          icon="pi pi-search"
          @click="handleSearch"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="comboStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="comboStore.error" severity="error" :closable="false">
      {{ comboStore.error }}
    </Message>

    <!-- Table -->
    <div v-else-if="comboStore.combos.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="comboStore.combos"
        :paginator="comboStore.pagination.totalPages > 1"
        :rows="comboStore.pagination.perPage"
        :totalRecords="comboStore.pagination.total"
        :lazy="true"
        @page="onPageChange"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column header="Imagen" style="width: 80px">
          <template #body="{ data }">
            <img
              v-if="data.tiendacombo_imagen"
              :src="getImageUrl(data.tiendacombo_imagen)"
              class="w-12 h-12 object-cover rounded"
            />
            <div v-else class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <i class="pi pi-box text-gray-400"></i>
            </div>
          </template>
        </Column>

        <Column field="tiendacombo_nombre" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ data.tiendacombo_nombre }}</span>
          </template>
        </Column>

        <Column header="Productos" style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="`${data.products?.length || 0} items`"
              severity="info"
            />
          </template>
        </Column>

        <Column header="Precio" style="width: 180px">
          <template #body="{ data }">
            <div>
              <span class="font-semibold text-primary">{{ formatCurrency(data.tiendacombo_precio) }}</span>
              <div v-if="data.tiendacombo_precioregular && data.savings" class="text-xs">
                <span class="line-through text-secondary-400">{{ formatCurrency(data.tiendacombo_precioregular) }}</span>
                <Tag
                  :value="`-${data.savings_percent}%`"
                  severity="success"
                  class="ml-1"
                />
              </div>
            </div>
          </template>
        </Column>

        <Column header="Visibilidad" style="width: 140px">
          <template #body="{ data }">
            <div class="flex flex-col gap-1 text-xs">
              <span v-if="data.tiendacombo_mostrar_catalogo" class="text-green-600">
                <i class="pi pi-check mr-1"></i>Catálogo
              </span>
              <span v-if="data.tiendacombo_mostrar_carrito" class="text-blue-600">
                <i class="pi pi-check mr-1"></i>Carrito
              </span>
            </div>
          </template>
        </Column>

        <Column field="tiendacombo_activo" header="Estado" sortable style="width: 100px">
          <template #body="{ data }">
            <InputSwitch
              :modelValue="data.tiendacombo_activo === 1"
              @update:modelValue="toggleStatus(data)"
            />
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
                @click="router.push({ name: 'marketing-combo-edit', params: { id: data.tiendacombo_id } })"
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
      <i class="pi pi-box text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay combos</h3>
      <p class="text-secondary-500 mb-4">
        Crea tu primer combo para ofrecer paquetes con descuento
      </p>
      <Button
        label="Nuevo Combo"
        icon="pi pi-plus"
        @click="router.push({ name: 'marketing-combo-create' })"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar el combo <strong>{{ comboToDelete?.tiendacombo_nombre }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteCombo"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComboStore } from '@/stores/combo.store'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import type { Combo } from '@/types/combo.types'

const router = useRouter()
const comboStore = useComboStore()
const toast = useToast()
const { formatCurrency } = useFormatters()

// Search
const searchQuery = ref('')

// Delete dialog
const showDeleteDialog = ref(false)
const comboToDelete = ref<Combo | null>(null)
const isDeleting = ref(false)

// Image URL helper
const getImageUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `https://api2.mitienda.pe/${path}`
}

// Methods
const handleSearch = () => {
  comboStore.fetchCombos({ search: searchQuery.value, page: 1 })
}

const onPageChange = (event: { page: number }) => {
  comboStore.fetchCombos({ search: searchQuery.value, page: event.page + 1 })
}

const toggleStatus = async (combo: Combo) => {
  try {
    const updated = await comboStore.toggleCombo(combo.tiendacombo_id)
    toast.add({
      severity: 'success',
      summary: updated.tiendacombo_activo === 1 ? 'Activado' : 'Desactivado',
      detail: `Combo ${updated.tiendacombo_activo === 1 ? 'activado' : 'desactivado'} correctamente`,
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cambiar el estado',
      life: 3000
    })
  }
}

const confirmDelete = (combo: Combo) => {
  comboToDelete.value = combo
  showDeleteDialog.value = true
}

const deleteCombo = async () => {
  if (!comboToDelete.value) return

  isDeleting.value = true
  try {
    await comboStore.deleteCombo(comboToDelete.value.tiendacombo_id)
    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'Combo eliminado correctamente',
      life: 3000
    })
    showDeleteDialog.value = false
    comboToDelete.value = null
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el combo',
      life: 3000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  comboStore.fetchCombos()
})
</script>
