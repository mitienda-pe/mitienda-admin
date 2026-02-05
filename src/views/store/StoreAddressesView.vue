<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Direcciones</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ storeInfoStore.addresses.length }} direcciones registradas
        </p>
      </div>
      <Button
        label="Nueva Dirección"
        icon="pi pi-plus"
        @click="$router.push({ name: 'store-address-create' })"
      />
    </div>

    <!-- Loading -->
    <div v-if="storeInfoStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="storeInfoStore.error" severity="error" :closable="false">
      {{ storeInfoStore.error }}
    </Message>

    <!-- Table -->
    <div v-else-if="storeInfoStore.addresses.length > 0">
      <!-- Mapa general -->
      <div
        v-if="addressesWithCoords.length > 0"
        class="bg-white rounded-lg shadow p-4 mb-6"
      >
        <div ref="mapContainer" class="w-full h-[300px] rounded-lg border border-gray-200 z-0"></div>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="storeInfoStore.addresses"
        :paginator="storeInfoStore.addresses.length > 10"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20]"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="tiendadireccion_nombresucursal" header="Sucursal" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ data.tiendadireccion_nombresucursal }}</span>
          </template>
        </Column>

        <Column field="tiendadireccion_direccion" header="Dirección" sortable>
          <template #body="{ data }">
            <div>
              <span>{{ data.tiendadireccion_direccion }}</span>
              <span v-if="data.tiendadireccion_interior" class="text-secondary-400">
                , Int. {{ data.tiendadireccion_interior }}
              </span>
            </div>
            <div v-if="data.tiendadireccion_dist || data.tiendadireccion_prov" class="text-xs text-secondary-400 mt-0.5">
              {{ [data.tiendadireccion_dist, data.tiendadireccion_prov, data.tiendadireccion_dpto].filter(Boolean).join(', ') }}
            </div>
          </template>
        </Column>

        <Column field="tiendadireccion_telefono" header="Teléfono" style="width: 140px">
          <template #body="{ data }">
            <span class="text-secondary-600">{{ data.tiendadireccion_telefono || '-' }}</span>
          </template>
        </Column>

        <Column field="tiendadireccion_swpublicado" header="Estado" sortable style="width: 120px">
          <template #body="{ data }">
            <Tag
              :value="data.tiendadireccion_swpublicado == 1 ? 'Publicada' : 'No publicada'"
              :severity="data.tiendadireccion_swpublicado == 1 ? 'success' : 'secondary'"
            />
          </template>
        </Column>

        <Column field="tiendadireccion_swalmacen" header="Punto de recojo" sortable style="width: 140px">
          <template #body="{ data }">
            <Tag
              :value="data.tiendadireccion_swalmacen == 1 ? 'Sí' : 'No'"
              :severity="data.tiendadireccion_swalmacen == 1 ? 'info' : 'secondary'"
            />
          </template>
        </Column>

        <Column field="tiendadireccion_swremitente" header="Remitente" sortable style="width: 130px">
          <template #body="{ data }">
            <Button
              v-if="data.tiendadireccion_swremitente == 1"
              icon="pi pi-check"
              label="Remitente"
              size="small"
              severity="success"
              outlined
              v-tooltip.top="'Dirección para etiquetas de envío. Clic para desmarcar'"
              :loading="isTogglingSender"
              @click="toggleSender(data)"
            />
            <Button
              v-else
              icon="pi pi-tag"
              size="small"
              text
              severity="secondary"
              v-tooltip.top="'Marcar como remitente para etiquetas'"
              :loading="isTogglingSender"
              @click="toggleSender(data)"
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
                @click="$router.push({ name: 'store-address-edit', params: { id: data.tiendadireccion_id } })"
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
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-map-marker text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay direcciones</h3>
      <p class="text-secondary-500 mb-4">
        Agrega la primera dirección o sucursal de tu negocio
      </p>
      <Button
        label="Nueva Dirección"
        icon="pi pi-plus"
        @click="$router.push({ name: 'store-address-create' })"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la dirección <strong>{{ addressToDelete?.tiendadireccion_nombresucursal }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteAddress"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useStoreInfoStore } from '@/stores/store-info.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { StoreAddress } from '@/types/store.types'

// Fix Leaflet default marker icons (broken by bundlers)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const storeInfoStore = useStoreInfoStore()
const toast = useToast()

const showDeleteDialog = ref(false)
const addressToDelete = ref<StoreAddress | null>(null)
const isDeleting = ref(false)
const isTogglingSender = ref(false)

// Map
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null

const addressesWithCoords = computed(() =>
  storeInfoStore.addresses.filter(
    a => a.tiendadireccion_latitud && a.tiendadireccion_longitud &&
         parseFloat(a.tiendadireccion_latitud) !== 0 && parseFloat(a.tiendadireccion_longitud) !== 0
  )
)

const initMap = () => {
  if (!mapContainer.value || map) return

  const coords = addressesWithCoords.value
  if (coords.length === 0) return

  map = L.map(mapContainer.value)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  const bounds: L.LatLngExpression[] = []

  coords.forEach(addr => {
    const lat = parseFloat(addr.tiendadireccion_latitud)
    const lng = parseFloat(addr.tiendadireccion_longitud)
    const point: L.LatLngExpression = [lat, lng]
    bounds.push(point)

    L.marker(point)
      .addTo(map!)
      .bindPopup(`<strong>${addr.tiendadireccion_nombresucursal}</strong><br>${addr.tiendadireccion_direccion}`)
  })

  if (bounds.length === 1) {
    map.setView(bounds[0], 16)
  } else {
    map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] })
  }
}

watch(addressesWithCoords, async (newVal) => {
  if (newVal.length > 0 && !map) {
    await nextTick()
    initMap()
  }
})

const confirmDelete = (address: StoreAddress) => {
  addressToDelete.value = address
  showDeleteDialog.value = true
}

const toggleSender = async (address: StoreAddress) => {
  try {
    isTogglingSender.value = true

    if (address.tiendadireccion_swremitente == 1) {
      await storeInfoStore.unsetSenderAddress(address.tiendadireccion_id)
      toast.add({
        severity: 'info',
        summary: 'Actualizado',
        detail: 'La dirección ya no es remitente',
        life: 3000
      })
    } else {
      await storeInfoStore.setSenderAddress(address.tiendadireccion_id)
      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Dirección marcada como remitente para etiquetas de envío',
        life: 3000
      })
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al actualizar la dirección',
      life: 5000
    })
  } finally {
    isTogglingSender.value = false
  }
}

const deleteAddress = async () => {
  if (!addressToDelete.value) return

  try {
    isDeleting.value = true
    await storeInfoStore.deleteAddress(addressToDelete.value.tiendadireccion_id)

    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'La dirección ha sido eliminada correctamente',
      life: 3000
    })

    showDeleteDialog.value = false
    addressToDelete.value = null
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar la dirección',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await storeInfoStore.fetchAddresses()
  await nextTick()
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>
