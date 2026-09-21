<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">Anuncios</h1>
        <p class="text-secondary-600 mt-1">Ventanas emergentes para promociones, lanzamientos o avisos en tu tienda</p>
      </div>
      <Button label="Nuevo popup" icon="pi pi-plus" @click="router.push('/marketing/announcement-popups/new')" />
    </div>

    <AnnouncementsTabs />

    <Card>
      <template #content>
        <DataTable
          :value="popups"
          :loading="loading"
          stripedRows
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          tableStyle="min-width: 50rem"
        >
          <Column field="popup_nombre" header="Nombre" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <img
                  v-if="data.popup_imagen_url"
                  :src="data.popup_imagen_url"
                  alt=""
                  class="w-10 h-10 rounded object-cover border border-secondary-200"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded border border-secondary-200"
                  :style="{ backgroundColor: data.popup_bg_color }"
                />
                <div>
                  <div class="font-medium">{{ data.popup_nombre }}</div>
                  <div v-if="data.popup_titulo" class="text-xs text-secondary-500 max-w-xs truncate">{{ data.popup_titulo }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column header="Cuándo aparece">
            <template #body="{ data }">
              <span class="text-sm">{{ describeTrigger(data) }}</span>
            </template>
          </Column>

          <Column header="Frecuencia">
            <template #body="{ data }">
              <span class="text-sm">{{ describeFrequency(data) }}</span>
            </template>
          </Column>

          <Column field="activo" header="Estado" sortable>
            <template #body="{ data }">
              <Tag :value="data.activo ? 'Activo' : 'Inactivo'" :severity="data.activo ? 'success' : 'secondary'" />
            </template>
          </Column>

          <Column field="fecha_inicio" header="Programación" sortable>
            <template #body="{ data }">
              <div class="text-sm">
                <div v-if="data.fecha_inicio || data.fecha_fin">
                  <div v-if="data.fecha_inicio" class="text-secondary-600">Desde: {{ formatDate(data.fecha_inicio) }}</div>
                  <div v-if="data.fecha_fin" class="text-secondary-600">Hasta: {{ formatDate(data.fecha_fin) }}</div>
                </div>
                <div v-else class="text-secondary-400">Sin fecha límite</div>
              </div>
            </template>
          </Column>

          <Column header="Acciones" style="width: 140px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="router.push(`/marketing/announcement-popups/${data.id}`)"
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
            <AppEmptyState
              v-if="!loading"
              icon="pi-window-maximize"
              title="Aún no tienes popups"
              description="Muestra una promoción o un aviso importante en una ventana sobre tu tienda."
              actionLabel="Crear primer popup"
              @action="router.push('/marketing/announcement-popups/new')"
            />
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { announcementPopupsApi } from '@/api/announcement-popups.api'
import type { AnnouncementPopup } from '@/types/announcement-popup.types'
import AnnouncementsTabs from '@/components/marketing/AnnouncementsTabs.vue'
import { AppEmptyState } from '@/components/ui'

import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const popups = ref<AnnouncementPopup[]>([])
const loading = ref(false)

onMounted(load)

async function load() {
  loading.value = true
  try {
    popups.value = await announcementPopupsApi.getAll()
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los popups', life: 3000 })
  } finally {
    loading.value = false
  }
}

function describeTrigger(p: AnnouncementPopup): string {
  if (p.disparador === 'exit') return 'Al intentar salir'
  if (p.disparador === 'scroll') return `Al bajar el ${p.disparador_valor}% de la página`
  return p.disparador_valor > 0 ? `A los ${p.disparador_valor} s de cargar` : 'Al cargar'
}

function describeFrequency(p: AnnouncementPopup): string {
  switch (p.frecuencia) {
    case 'always': return 'En cada página'
    case 'once': return 'Una sola vez'
    case 'days': return p.frecuencia_dias === 1 ? 'Una vez al día' : `Cada ${p.frecuencia_dias} días`
    default: return 'Una vez por visita'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function confirmDelete(popup: AnnouncementPopup) {
  confirm.require({
    message: `¿Eliminar el popup "${popup.popup_nombre}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await announcementPopupsApi.delete(popup.id)
        popups.value = popups.value.filter(p => p.id !== popup.id)
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Popup eliminado', life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el popup', life: 3000 })
      }
    }
  })
}
</script>
