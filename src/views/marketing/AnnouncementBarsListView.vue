<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">Barras de Anuncio</h1>
        <p class="text-secondary-600 mt-1">Gestiona las barras de anuncio tipo HelloBar</p>
      </div>
      <Button label="Nueva Barra" icon="pi pi-plus" @click="router.push('/marketing/announcement-bars/new')" />
    </div>

    <!-- Tabla -->
    <Card>
      <template #content>
        <DataTable
          :value="barsStore.bars"
          :loading="barsStore.loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          tableStyle="min-width: 50rem"
        >
          <Column field="bar_nombre" header="Nombre" sortable>
            <template #body="{ data }">
              <div class="font-medium">{{ data.bar_nombre }}</div>
            </template>
          </Column>

          <Column field="bar_texto" header="Texto" sortable>
            <template #body="{ data }">
              <div class="max-w-xs truncate">{{ data.bar_texto }}</div>
            </template>
          </Column>

          <Column field="bar_posicion" header="Posición" sortable>
            <template #body="{ data }">
              <Tag :value="getPositionLabel(data.bar_posicion)" :severity="data.bar_posicion === 'top' ? 'info' : 'secondary'" />
            </template>
          </Column>

          <Column header="Vista previa">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <div
                  class="w-12 h-6 rounded border border-secondary-200"
                  :style="{ backgroundColor: data.bar_bg_color }"
                />
                <span class="text-xs text-secondary-500">{{ data.bar_bg_color }}</span>
              </div>
            </template>
          </Column>

          <Column field="activo" header="Estado" sortable>
            <template #body="{ data }">
              <Tag :value="data.activo ? 'Activa' : 'Inactiva'" :severity="data.activo ? 'success' : 'secondary'" />
            </template>
          </Column>

          <Column field="fecha_inicio" header="Programación" sortable>
            <template #body="{ data }">
              <div class="text-sm">
                <div v-if="data.fecha_inicio || data.fecha_fin">
                  <div v-if="data.fecha_inicio" class="text-secondary-600">
                    Desde: {{ formatDate(data.fecha_inicio) }}
                  </div>
                  <div v-if="data.fecha_fin" class="text-secondary-600">
                    Hasta: {{ formatDate(data.fecha_fin) }}
                  </div>
                </div>
                <div v-else class="text-secondary-400">Siempre visible</div>
              </div>
            </template>
          </Column>

          <Column header="Acciones" style="width: 180px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="router.push(`/marketing/announcement-bars/${data.id}`)"
                  v-tooltip.top="'Editar'"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  @click="confirmDelete(data)"
                  v-tooltip.top="'Eliminar'"
                />
              </div>
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-megaphone text-4xl text-secondary-300 mb-3"></i>
              <p class="text-secondary-500">No hay barras de anuncio creadas</p>
              <Button label="Crear primera barra" icon="pi pi-plus" class="mt-3" @click="router.push('/marketing/announcement-bars/new')" />
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAnnouncementBarsStore } from '@/stores/announcement-bars.store'
import type { AnnouncementBar, BarPosition } from '@/types/announcement-bar.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const barsStore = useAnnouncementBarsStore()

onMounted(() => {
  barsStore.fetchBars()
})

function getPositionLabel(position: BarPosition): string {
  return position === 'top' ? 'Superior' : 'Inferior'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function confirmDelete(bar: AnnouncementBar) {
  confirm.require({
    message: `¿Estás seguro de eliminar la barra "${bar.bar_nombre}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await barsStore.deleteBar(bar.id)
        toast.add({
          severity: 'success',
          summary: 'Eliminada',
          detail: 'Barra de anuncio eliminada exitosamente',
          life: 3000
        })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar la barra de anuncio',
          life: 3000
        })
      }
    }
  })
}
</script>
