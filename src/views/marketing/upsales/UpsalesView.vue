<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Upsales</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Muestra productos sugeridos durante el checkout
        </p>
      </div>
      <Button
        label="Nuevo Upsale"
        icon="pi pi-plus"
        @click="router.push({ name: 'marketing-upsale-create' })"
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
    <div v-if="upsaleStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="upsaleStore.error" severity="error" :closable="false">
      {{ upsaleStore.error }}
    </Message>

    <!-- Table -->
    <div v-else-if="upsaleStore.upsales.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="upsaleStore.upsales"
        :paginator="upsaleStore.pagination.totalPages > 1"
        :rows="upsaleStore.pagination.perPage"
        :totalRecords="upsaleStore.pagination.total"
        :lazy="true"
        @page="onPageChange"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="tiendaupsale_nombre" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ data.tiendaupsale_nombre }}</span>
          </template>
        </Column>

        <Column header="Triggers" style="width: 120px">
          <template #body="{ data }">
            <Tag
              :value="`${data.triggers?.length || 0} productos`"
              severity="info"
            />
          </template>
        </Column>

        <Column header="Sugeridos" style="width: 120px">
          <template #body="{ data }">
            <Tag
              :value="`${data.suggested?.length || 0} productos`"
              severity="success"
            />
          </template>
        </Column>

        <Column field="tiendaupsale_fechacreacion" header="Fecha" sortable style="width: 150px">
          <template #body="{ data }">
            <span class="text-secondary-600 text-sm">
              {{ formatDate(data.tiendaupsale_fechacreacion) }}
            </span>
          </template>
        </Column>

        <Column field="tiendaupsale_activo" header="Estado" sortable style="width: 100px">
          <template #body="{ data }">
            <InputSwitch
              :modelValue="data.tiendaupsale_activo === 1"
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
                @click="router.push({ name: 'marketing-upsale-edit', params: { id: data.tiendaupsale_id } })"
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
      <i class="pi pi-arrow-up text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay upsales</h3>
      <p class="text-secondary-500 mb-4">
        Crea tu primer upsale para mostrar productos sugeridos en el checkout
      </p>
      <Button
        label="Nuevo Upsale"
        icon="pi pi-plus"
        @click="router.push({ name: 'marketing-upsale-create' })"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar el upsale <strong>{{ upsaleToDelete?.tiendaupsale_nombre }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteUpsale"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUpsaleStore } from '@/stores/upsale.store'
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
import type { Upsale } from '@/types/upsale.types'

const router = useRouter()
const upsaleStore = useUpsaleStore()
const toast = useToast()
const { formatDate } = useFormatters()

// Search
const searchQuery = ref('')

// Delete dialog
const showDeleteDialog = ref(false)
const upsaleToDelete = ref<Upsale | null>(null)
const isDeleting = ref(false)

// Methods
const handleSearch = () => {
  upsaleStore.fetchUpsales({ search: searchQuery.value, page: 1 })
}

const onPageChange = (event: { page: number }) => {
  upsaleStore.fetchUpsales({ search: searchQuery.value, page: event.page + 1 })
}

const toggleStatus = async (upsale: Upsale) => {
  try {
    const updated = await upsaleStore.toggleUpsale(upsale.tiendaupsale_id)
    toast.add({
      severity: 'success',
      summary: updated.tiendaupsale_activo === 1 ? 'Activado' : 'Desactivado',
      detail: `Upsale ${updated.tiendaupsale_activo === 1 ? 'activado' : 'desactivado'} correctamente`,
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

const confirmDelete = (upsale: Upsale) => {
  upsaleToDelete.value = upsale
  showDeleteDialog.value = true
}

const deleteUpsale = async () => {
  if (!upsaleToDelete.value) return

  isDeleting.value = true
  try {
    await upsaleStore.deleteUpsale(upsaleToDelete.value.tiendaupsale_id)
    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'Upsale eliminado correctamente',
      life: 3000
    })
    showDeleteDialog.value = false
    upsaleToDelete.value = null
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el upsale',
      life: 3000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  upsaleStore.fetchUpsales()
})
</script>
