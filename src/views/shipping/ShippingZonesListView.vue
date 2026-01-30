<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Zonas de Reparto</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Agrupa localidades geográficas para asignarles tarifas de envío.
        </p>
      </div>
      <Button
        label="Nueva Zona"
        icon="pi pi-plus"
        @click="router.push('/shipping/zones/new')"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <!-- Empty State -->
    <div
      v-else-if="store.zones.length === 0"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <i class="pi pi-map text-4xl text-secondary-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-secondary-700 mb-2">No hay zonas de reparto</h3>
      <p class="text-secondary-500 mb-4">Crea tu primera zona para agrupar localidades.</p>
      <Button
        label="Crear Zona"
        icon="pi pi-plus"
        @click="router.push('/shipping/zones/new')"
      />
    </div>

    <!-- Zones Table -->
    <div v-else class="bg-white rounded-lg shadow">
      <DataTable
        :value="store.zones"
        :paginator="store.zones.length > 10"
        :rows="10"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="name" header="Nombre" sortable>
          <template #body="{ data }">
            <router-link
              :to="`/shipping/zones/${data.id}`"
              class="text-primary hover:underline font-medium"
            >
              {{ data.name }}
            </router-link>
          </template>
        </Column>
        <Column field="levelLabel" header="Nivel" sortable />
        <Column field="ubigeoCount" header="Localidades" sortable>
          <template #body="{ data }">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              {{ data.ubigeoCount }}
            </span>
          </template>
        </Column>
        <Column field="createdAt" header="Fecha de Creación" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>
        <Column header="Acciones" style="width: 120px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Button
                icon="pi pi-eye"
                text
                rounded
                size="small"
                severity="secondary"
                @click="router.push(`/shipping/zones/${data.id}`)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar Zona"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la zona <strong>{{ zoneToDelete?.name }}</strong>?</p>
      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="handleDelete"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShippingZonesStore } from '@/stores/shipping-zones.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { ShippingZone } from '@/types/shipping-zone.types'

const router = useRouter()
const store = useShippingZonesStore()
const toast = useToast()

const showDeleteDialog = ref(false)
const zoneToDelete = ref<ShippingZone | null>(null)
const isDeleting = ref(false)

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })
}

function confirmDelete(zone: ShippingZone) {
  zoneToDelete.value = zone
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!zoneToDelete.value) return
  try {
    isDeleting.value = true
    await store.deleteZone(zoneToDelete.value.id)
    toast.add({
      severity: 'success',
      summary: 'Eliminada',
      detail: 'Zona eliminada correctamente',
      life: 3000,
    })
    showDeleteDialog.value = false
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al eliminar zona',
      life: 5000,
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  store.fetchZones()
})
</script>
