<template>
  <div>
    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <!-- Detail -->
    <template v-else-if="store.currentZone">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            @click="router.push('/shipping/zones')"
          />
          <div>
            <div class="flex items-center gap-2">
              <h1 v-if="!isEditingName" class="text-2xl font-bold text-secondary">
                {{ store.currentZone.name }}
              </h1>
              <InputText
                v-else
                v-model="editName"
                class="text-2xl font-bold"
                @keyup.enter="saveName"
                @keyup.escape="cancelEditName"
                autofocus
              />
              <Button
                v-if="!isEditingName"
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                @click="startEditName"
              />
              <template v-else>
                <Button
                  icon="pi pi-check"
                  text
                  rounded
                  size="small"
                  severity="success"
                  :loading="isSavingName"
                  @click="saveName"
                />
                <Button
                  icon="pi pi-times"
                  text
                  rounded
                  size="small"
                  severity="secondary"
                  @click="cancelEditName"
                />
              </template>
            </div>
            <p class="text-sm text-secondary-400 mt-1">
              Nivel: {{ store.currentZone.levelLabel }} · {{ store.currentZone.ubigeoCount }} localidades
            </p>
          </div>
        </div>

        <Button
          label="Agregar Localidades"
          icon="pi pi-plus"
          @click="showAddDialog = true"
        />
      </div>

      <!-- Ubigeos Table -->
      <div class="bg-white rounded-lg shadow">
        <DataTable
          :value="store.currentZone.ubigeos"
          :paginator="store.currentZone.ubigeos.length > 15"
          :rows="15"
          stripedRows
          class="p-datatable-sm"
        >
          <Column field="name" header="Localidad" sortable />
          <Column header="Código" style="width: 200px">
            <template #body="{ data }">
              <span class="text-sm text-secondary-500 font-mono">
                {{ formatCode(data) }}
              </span>
            </template>
          </Column>
          <Column header="Acciones" style="width: 80px">
            <template #body="{ data }">
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                @click="confirmRemoveUbigeo(data)"
              />
            </template>
          </Column>

          <template #empty>
            <div class="text-center py-8 text-secondary-400">
              <i class="pi pi-map text-3xl mb-2"></i>
              <p>No hay localidades asignadas a esta zona.</p>
            </div>
          </template>
        </DataTable>
      </div>
    </template>

    <!-- Remove Ubigeo Confirmation Dialog -->
    <Dialog
      v-model:visible="showRemoveDialog"
      header="Eliminar Localidad"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar <strong>{{ ubigeoToRemove?.name }}</strong> de esta zona?</p>
      <template #footer>
        <Button label="Cancelar" text @click="showRemoveDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isRemoving"
          @click="handleRemoveUbigeo"
        />
      </template>
    </Dialog>

    <!-- Add Ubigeos Dialog -->
    <Dialog
      v-model:visible="showAddDialog"
      header="Agregar Localidades"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <!-- Hierarchical Selectors -->
      <div class="grid grid-cols-1 gap-4 mb-4">
        <!-- Country -->
        <div v-if="store.currentZone && store.currentZone.level >= 2">
          <label class="block text-sm font-medium text-secondary-700 mb-1">País</label>
          <Dropdown
            v-model="addSelectedCountry"
            :options="addCountries"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar país"
            class="w-full"
            :loading="addLoadingCountries"
            @change="onAddCountryChange"
          />
        </div>

        <!-- Region -->
        <div v-if="store.currentZone && store.currentZone.level >= 3">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Región / Departamento</label>
          <Dropdown
            v-model="addSelectedRegion"
            :options="addRegions"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar región"
            class="w-full"
            :loading="addLoadingRegions"
            :disabled="!addSelectedCountry"
            @change="onAddRegionChange"
          />
        </div>

        <!-- Province -->
        <div v-if="store.currentZone && store.currentZone.level >= 4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Provincia</label>
          <Dropdown
            v-model="addSelectedProvince"
            :options="addProvinces"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar provincia"
            class="w-full"
            :loading="addLoadingProvinces"
            :disabled="!addSelectedRegion"
            @change="onAddProvinceChange"
          />
        </div>
      </div>

      <!-- Available items -->
      <div v-if="addAvailableItems.length > 0 || addLoadingItems" class="mb-4">
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Localidades disponibles
          <span class="text-secondary-400 font-normal">(haz clic para agregar)</span>
        </label>
        <div v-if="addLoadingItems" class="flex justify-center py-4">
          <ProgressSpinner style="width: 30px; height: 30px" />
        </div>
        <div v-else class="border rounded-lg p-3 max-h-60 overflow-y-auto">
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="item in addAvailableItems"
              :key="item.id"
              :label="item.name"
              size="small"
              outlined
              severity="secondary"
              icon="pi pi-plus"
              :loading="addingUbigeoId === item.id"
              @click="handleAddUbigeo(item)"
            />
          </div>
          <p v-if="addAvailableItems.length === 0" class="text-sm text-secondary-400 italic">
            No hay localidades disponibles.
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" text @click="showAddDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShippingZonesStore } from '@/stores/shipping-zones.store'
import { shippingZonesApi } from '@/api/shipping-zones.api'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { ZoneUbigeo, UbigeoOption } from '@/types/shipping-zone.types'

const route = useRoute()
const router = useRouter()
const store = useShippingZonesStore()
const toast = useToast()

// --- Edit Name ---
const isEditingName = ref(false)
const editName = ref('')
const isSavingName = ref(false)

function startEditName() {
  if (!store.currentZone) return
  editName.value = store.currentZone.name
  isEditingName.value = true
}

function cancelEditName() {
  isEditingName.value = false
}

async function saveName() {
  if (!store.currentZone || !editName.value.trim()) return
  try {
    isSavingName.value = true
    await store.updateZone(store.currentZone.id, editName.value.trim())
    isEditingName.value = false
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Nombre de zona actualizado',
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al actualizar nombre',
      life: 5000,
    })
  } finally {
    isSavingName.value = false
  }
}

// --- Remove Ubigeo ---
const showRemoveDialog = ref(false)
const ubigeoToRemove = ref<ZoneUbigeo | null>(null)
const isRemoving = ref(false)

function confirmRemoveUbigeo(ubigeo: ZoneUbigeo) {
  ubigeoToRemove.value = ubigeo
  showRemoveDialog.value = true
}

async function handleRemoveUbigeo() {
  if (!ubigeoToRemove.value || !store.currentZone) return
  try {
    isRemoving.value = true
    await store.removeUbigeo(store.currentZone.id, ubigeoToRemove.value.ubigeoId)
    toast.add({
      severity: 'success',
      summary: 'Eliminada',
      detail: 'Localidad eliminada de la zona',
      life: 3000,
    })
    showRemoveDialog.value = false
    // Also remove from add dialog available items if open
    refreshAddAvailableItems()
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al eliminar localidad',
      life: 5000,
    })
  } finally {
    isRemoving.value = false
  }
}

// --- Add Ubigeo Dialog ---
const showAddDialog = ref(false)
const addCountries = ref<UbigeoOption[]>([])
const addRegions = ref<UbigeoOption[]>([])
const addProvinces = ref<UbigeoOption[]>([])
const addAvailableItems = ref<UbigeoOption[]>([])

const addSelectedCountry = ref<number | null>(null)
const addSelectedRegion = ref<number | null>(null)
const addSelectedProvince = ref<number | null>(null)

const addLoadingCountries = ref(false)
const addLoadingRegions = ref(false)
const addLoadingProvinces = ref(false)
const addLoadingItems = ref(false)
const addingUbigeoId = ref<number | null>(null)

function getAddSelectedCountryCodes() {
  return addCountries.value.find((c) => c.id === addSelectedCountry.value)
}

function getAddSelectedRegionCodes() {
  return addRegions.value.find((r) => r.id === addSelectedRegion.value)
}

function getAddSelectedProvinceCodes() {
  return addProvinces.value.find((p) => p.id === addSelectedProvince.value)
}

// When dialog opens, load countries
watch(showAddDialog, async (val) => {
  if (val && store.currentZone) {
    addSelectedCountry.value = null
    addSelectedRegion.value = null
    addSelectedProvince.value = null
    addRegions.value = []
    addProvinces.value = []
    addAvailableItems.value = []

    if (store.currentZone.level === 1) {
      // At country level, load countries as available items
      await loadAddAvailableCountries()
    } else {
      addLoadingCountries.value = true
      try {
        addCountries.value = await shippingZonesApi.getCountries()
      } finally {
        addLoadingCountries.value = false
      }
    }
  }
})

async function loadAddAvailableCountries() {
  addLoadingItems.value = true
  try {
    const countries = await shippingZonesApi.getCountries()
    const existingIds = new Set(store.currentZone?.ubigeos.map((u) => u.ubigeoId) || [])
    addAvailableItems.value = countries.filter((c) => !existingIds.has(c.id))
  } finally {
    addLoadingItems.value = false
  }
}

async function onAddCountryChange() {
  addSelectedRegion.value = null
  addSelectedProvince.value = null
  addRegions.value = []
  addProvinces.value = []
  addAvailableItems.value = []

  const country = getAddSelectedCountryCodes()
  if (!country || !store.currentZone) return

  if (store.currentZone.level === 2) {
    await loadAddAvailableRegions()
  } else if (store.currentZone.level >= 3) {
    addLoadingRegions.value = true
    try {
      addRegions.value = await shippingZonesApi.getRegions(country.codPais)
    } finally {
      addLoadingRegions.value = false
    }
  }
}

async function onAddRegionChange() {
  addSelectedProvince.value = null
  addProvinces.value = []
  addAvailableItems.value = []

  const country = getAddSelectedCountryCodes()
  const region = getAddSelectedRegionCodes()
  if (!country || !region || !store.currentZone) return

  if (store.currentZone.level === 3) {
    await loadAddAvailableProvinces()
  } else if (store.currentZone.level === 4) {
    addLoadingProvinces.value = true
    try {
      addProvinces.value = await shippingZonesApi.getProvinces(country.codPais, region.codDpto!)
    } finally {
      addLoadingProvinces.value = false
    }
  }
}

async function onAddProvinceChange() {
  addAvailableItems.value = []
  if (store.currentZone?.level === 4) {
    await loadAddAvailableDistricts()
  }
}

async function loadAddAvailableRegions() {
  const country = getAddSelectedCountryCodes()
  if (!country) return
  addLoadingItems.value = true
  try {
    const data = await shippingZonesApi.getRegions(country.codPais)
    const existingIds = new Set(store.currentZone?.ubigeos.map((u) => u.ubigeoId) || [])
    addAvailableItems.value = data.filter((r) => !existingIds.has(r.id))
  } finally {
    addLoadingItems.value = false
  }
}

async function loadAddAvailableProvinces() {
  const country = getAddSelectedCountryCodes()
  const region = getAddSelectedRegionCodes()
  if (!country || !region) return
  addLoadingItems.value = true
  try {
    const data = await shippingZonesApi.getProvinces(country.codPais, region.codDpto!)
    const existingIds = new Set(store.currentZone?.ubigeos.map((u) => u.ubigeoId) || [])
    addAvailableItems.value = data.filter((p) => !existingIds.has(p.id))
  } finally {
    addLoadingItems.value = false
  }
}

async function loadAddAvailableDistricts() {
  const country = getAddSelectedCountryCodes()
  const region = getAddSelectedRegionCodes()
  const province = getAddSelectedProvinceCodes()
  if (!country || !region || !province) return
  addLoadingItems.value = true
  try {
    const data = await shippingZonesApi.getDistricts(country.codPais, region.codDpto!, province.codProv!)
    const existingIds = new Set(store.currentZone?.ubigeos.map((u) => u.ubigeoId) || [])
    addAvailableItems.value = data.filter((d) => !existingIds.has(d.id))
  } finally {
    addLoadingItems.value = false
  }
}

function refreshAddAvailableItems() {
  if (!showAddDialog.value || !store.currentZone) return
  const existingIds = new Set(store.currentZone.ubigeos.map((u) => u.ubigeoId))
  addAvailableItems.value = addAvailableItems.value.filter((item) => !existingIds.has(item.id))
}

async function handleAddUbigeo(item: UbigeoOption) {
  if (!store.currentZone) return

  const country = getAddSelectedCountryCodes()
  const region = getAddSelectedRegionCodes()
  const province = getAddSelectedProvinceCodes()

  try {
    addingUbigeoId.value = item.id
    await store.addUbigeo(store.currentZone.id, {
      ubigeo_id: item.id,
      codPais: item.codPais ?? country?.codPais ?? 0,
      codDpto: item.codDpto ?? region?.codDpto ?? 0,
      codProv: item.codProv ?? province?.codProv ?? 0,
      codDist: item.codDist ?? 0,
    })
    // Remove from available list
    addAvailableItems.value = addAvailableItems.value.filter((a) => a.id !== item.id)
    toast.add({
      severity: 'success',
      summary: 'Agregada',
      detail: `"${item.name}" agregada a la zona`,
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al agregar localidad',
      life: 5000,
    })
  } finally {
    addingUbigeoId.value = null
  }
}

// --- Helpers ---
function formatCode(ubigeo: ZoneUbigeo): string {
  const parts = [ubigeo.codPais]
  if (ubigeo.codDpto) parts.push(ubigeo.codDpto)
  if (ubigeo.codProv) parts.push(ubigeo.codProv)
  if (ubigeo.codDist) parts.push(ubigeo.codDist)
  return parts.join('-')
}

// --- Lifecycle ---
onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    store.fetchZone(id)
  }
})
</script>
