<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Visores 3D / AR</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Productos que tus clientes pueden ver en 3D y probar en su espacio con la cámara.
        </p>
      </div>
      <AppButton icon="pi pi-plus" label="Nuevo visor" @click="$router.push({ name: 'ar-widget-create' })" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <AppErrorState v-else-if="error" :message="error" @retry="load" />

    <AppEmptyState
      v-else-if="widgets.length === 0"
      icon="pi pi-box"
      title="Todavía no hay visores"
      message="Elegí un producto, cargá sus medidas reales y las fotos que mejor lo muestren."
    >
      <AppButton icon="pi pi-plus" label="Crear el primero" @click="$router.push({ name: 'ar-widget-create' })" />
    </AppEmptyState>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable :value="widgets" data-key="id" responsive-layout="scroll">
        <Column header="Producto">
          <template #body="{ data }">
            <p class="font-medium text-secondary">{{ data.producto_titulo || `#${data.producto_id}` }}</p>
            <p class="text-xs text-secondary-400">ID del producto: {{ data.external_id }}</p>
          </template>
        </Column>

        <Column header="Estado" style="width: 9rem">
          <template #body="{ data }">
            <AppBadge :severity="data.status === 1 ? 'success' : 'secondary'">
              {{ data.status === 1 ? 'Publicado' : 'Borrador' }}
            </AppBadge>
          </template>
        </Column>

        <Column header="Medidas" style="width: 14rem">
          <template #body="{ data }">
            <span v-if="hasMeasures(data)" class="text-sm text-secondary-600">
              {{ data.width_cm }} × {{ data.height_cm }} × {{ data.depth_cm }} cm
            </span>
            <!-- Sin las tres medidas el visor dibujaría estimaciones sobre el
                 modelo, así que el storefront las oculta. Conviene que se vea. -->
            <span v-else class="text-sm text-amber-600">
              <i class="pi pi-exclamation-triangle text-xs" /> Sin medidas
            </span>
          </template>
        </Column>

        <Column header="Fotos" style="width: 6rem">
          <template #body="{ data }">
            <span class="text-sm text-secondary-600">{{ data.images.length }}</span>
          </template>
        </Column>

        <Column header="Modelos" style="width: 7rem">
          <template #body="{ data }">
            <span class="text-sm text-secondary-600">{{ data.rebuild_count }}</span>
          </template>
        </Column>

        <Column style="width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2 justify-end">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                aria-label="Editar"
                @click="$router.push({ name: 'ar-widget-edit', params: { id: data.id } })"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                aria-label="Eliminar"
                @click="confirmRemove(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <p v-if="widgets.length" class="text-xs text-secondary-400 mt-3">
      La columna <strong>Modelos</strong> cuenta cuántos modelos 3D consumió cada producto de tu plan.
      Cambiar las fotos, las medidas o la categoría genera uno nuevo.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { AppButton, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import { arWidgetApi } from '@/api/ar-widget.api'
import type { ArWidget } from '@/types/ar-widget.types'

const toast = useToast()
const confirm = useConfirm()

const widgets = ref<ArWidget[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const hasMeasures = (w: ArWidget) => w.width_cm !== null && w.height_cm !== null && w.depth_cm !== null

const load = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await arWidgetApi.getAll()
    widgets.value = response.data ?? []
  } catch {
    error.value = 'No se pudieron cargar los visores'
  } finally {
    isLoading.value = false
  }
}

const confirmRemove = (widget: ArWidget) => {
  confirm.require({
    header: 'Eliminar visor',
    // El modelo ya generado vive del lado del proveedor: borrar acá saca el
    // visor de la tienda, no devuelve la unidad del plan.
    message: `El producto "${widget.producto_titulo}" dejará de mostrar el visor 3D. El modelo ya generado no se recupera si lo volvés a crear: contaría de nuevo.`,
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await arWidgetApi.remove(widget.id)
        widgets.value = widgets.value.filter(w => w.id !== widget.id)
        toast.add({ severity: 'success', summary: 'Visor eliminado', life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 5000 })
      }
    }
  })
}

onMounted(load)
</script>
