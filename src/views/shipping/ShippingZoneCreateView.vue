<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="router.push('/shipping/zones')"
      />
      <div>
        <h1 class="text-2xl font-bold text-secondary">Nueva Zona de Reparto</h1>
        <p class="text-sm text-secondary-400 mt-1">Define un nombre, nivel geográfico y las localidades que la componen.</p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <!-- Zone Name -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre de la zona</label>
        <InputText
          v-model="zoneName"
          class="w-full"
          placeholder="Ej: Lima Metropolitana, Costa Norte..."
        />
      </div>

      <!-- Level Selection -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-secondary-700 mb-2">Nivel geográfico</label>
        <SelectButton
          v-model="selectedLevel"
          :options="levelOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          @change="onLevelChange"
        />
      </div>

      <!-- Hierarchical Selectors -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Country selector (always visible) -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">País</label>
          <Dropdown
            v-model="selectedCountry"
            :options="countries"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar país"
            class="w-full"
            :loading="loadingCountries"
            @change="onCountryChange"
          />
        </div>

        <!-- Region selector (level >= 2) -->
        <div v-if="selectedLevel >= 3">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Región / Departamento</label>
          <Dropdown
            v-model="selectedRegion"
            :options="regions"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar región"
            class="w-full"
            :loading="loadingRegions"
            :disabled="!selectedCountry"
            @change="onRegionChange"
          />
        </div>

        <!-- Province selector (level >= 3) -->
        <div v-if="selectedLevel >= 4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Provincia</label>
          <Dropdown
            v-model="selectedProvince"
            :options="provinces"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar provincia"
            class="w-full"
            :loading="loadingProvinces"
            :disabled="!selectedRegion"
            @change="onProvinceChange"
          />
        </div>
      </div>

      <!-- Available items to add -->
      <div class="mb-6" v-if="availableItems.length > 0 || loadingAvailable">
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Localidades disponibles
          <span class="text-secondary-400 font-normal">(haz clic para agregar)</span>
        </label>
        <div v-if="loadingAvailable" class="flex justify-center py-4">
          <ProgressSpinner style="width: 30px; height: 30px" />
        </div>
        <div v-else class="border rounded-lg p-3 max-h-60 overflow-y-auto">
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="item in availableItems"
              :key="item.id"
              :label="item.name"
              size="small"
              outlined
              severity="secondary"
              icon="pi pi-plus"
              @click="addItem(item)"
            />
          </div>
          <p v-if="availableItems.length === 0" class="text-sm text-secondary-400 italic">
            No hay localidades disponibles.
          </p>
        </div>
      </div>

      <!-- Selected items -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Localidades seleccionadas
          <span class="text-secondary-400 font-normal">({{ selectedItems.length }})</span>
        </label>
        <div class="border rounded-lg p-3 min-h-[80px]">
          <div v-if="selectedItems.length === 0" class="text-sm text-secondary-400 italic py-2">
            Selecciona localidades de la lista de arriba.
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <Button
              v-for="item in selectedItems"
              :key="item.id"
              :label="item.name"
              size="small"
              severity="info"
              icon="pi pi-times"
              @click="removeItem(item)"
            />
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          text
          severity="secondary"
          @click="router.push('/shipping/zones')"
        />
        <Button
          label="Crear Zona"
          icon="pi pi-check"
          :loading="isSaving"
          :disabled="!canSave"
          @click="handleSave"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShippingZonesStore } from '@/stores/shipping-zones.store'
import { shippingZonesApi } from '@/api/shipping-zones.api'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import type { UbigeoOption } from '@/types/shipping-zone.types'

const router = useRouter()
const store = useShippingZonesStore()
const toast = useToast()

const zoneName = ref('')
const selectedLevel = ref<1 | 2 | 3 | 4>(2)
const isSaving = ref(false)

const levelOptions = [
  { label: 'País', value: 1 },
  { label: 'Región', value: 2 },
  { label: 'Provincia', value: 3 },
  { label: 'Distrito', value: 4 },
]

// Hierarchical selectors
const countries = ref<UbigeoOption[]>([])
const regions = ref<UbigeoOption[]>([])
const provinces = ref<UbigeoOption[]>([])

const selectedCountry = ref<number | null>(null)
const selectedRegion = ref<number | null>(null)
const selectedProvince = ref<number | null>(null)

const loadingCountries = ref(false)
const loadingRegions = ref(false)
const loadingProvinces = ref(false)
const loadingAvailable = ref(false)

// Available and selected items
const availableItems = ref<UbigeoOption[]>([])
const selectedItems = ref<UbigeoOption[]>([])

const canSave = computed(() => {
  return zoneName.value.trim().length > 0 && selectedItems.value.length > 0
})

function getSelectedCountryCodes() {
  return countries.value.find((c) => c.id === selectedCountry.value)
}

function getSelectedRegionCodes() {
  return regions.value.find((r) => r.id === selectedRegion.value)
}

function getSelectedProvinceCodes() {
  return provinces.value.find((p) => p.id === selectedProvince.value)
}

function onLevelChange() {
  selectedItems.value = []
  availableItems.value = []
  selectedRegion.value = null
  selectedProvince.value = null
  regions.value = []
  provinces.value = []

  if (selectedLevel.value === 1) {
    loadAvailableCountries()
  } else if (selectedLevel.value === 2 && selectedCountry.value) {
    loadAvailableRegions()
  }
}

async function onCountryChange() {
  selectedRegion.value = null
  selectedProvince.value = null
  regions.value = []
  provinces.value = []
  selectedItems.value = []
  availableItems.value = []

  if (selectedLevel.value === 1) {
    // At country level, available items are already loaded
    return
  }

  const country = getSelectedCountryCodes()
  if (!country) return

  if (selectedLevel.value === 2) {
    await loadAvailableRegions()
  } else if (selectedLevel.value >= 3) {
    loadingRegions.value = true
    try {
      regions.value = await shippingZonesApi.getRegions(country.codPais)
    } finally {
      loadingRegions.value = false
    }
  }
}

async function onRegionChange() {
  selectedProvince.value = null
  provinces.value = []
  selectedItems.value = []
  availableItems.value = []

  const country = getSelectedCountryCodes()
  const region = getSelectedRegionCodes()
  if (!country || !region) return

  if (selectedLevel.value === 3) {
    await loadAvailableProvinces()
  } else if (selectedLevel.value === 4) {
    loadingProvinces.value = true
    try {
      provinces.value = await shippingZonesApi.getProvinces(country.codPais, region.codDpto!)
    } finally {
      loadingProvinces.value = false
    }
  }
}

async function onProvinceChange() {
  selectedItems.value = []
  availableItems.value = []

  if (selectedLevel.value === 4) {
    await loadAvailableDistricts()
  }
}

async function loadAvailableCountries() {
  loadingAvailable.value = true
  try {
    availableItems.value = countries.value.filter(
      (c) => !selectedItems.value.some((s) => s.id === c.id),
    )
  } finally {
    loadingAvailable.value = false
  }
}

async function loadAvailableRegions() {
  const country = getSelectedCountryCodes()
  if (!country) return
  loadingAvailable.value = true
  try {
    const data = await shippingZonesApi.getRegions(country.codPais)
    availableItems.value = data.filter(
      (r) => !selectedItems.value.some((s) => s.id === r.id),
    )
  } finally {
    loadingAvailable.value = false
  }
}

async function loadAvailableProvinces() {
  const country = getSelectedCountryCodes()
  const region = getSelectedRegionCodes()
  if (!country || !region) return
  loadingAvailable.value = true
  try {
    const data = await shippingZonesApi.getProvinces(country.codPais, region.codDpto!)
    availableItems.value = data.filter(
      (p) => !selectedItems.value.some((s) => s.id === p.id),
    )
  } finally {
    loadingAvailable.value = false
  }
}

async function loadAvailableDistricts() {
  const country = getSelectedCountryCodes()
  const region = getSelectedRegionCodes()
  const province = getSelectedProvinceCodes()
  if (!country || !region || !province) return
  loadingAvailable.value = true
  try {
    const data = await shippingZonesApi.getDistricts(country.codPais, region.codDpto!, province.codProv!)
    availableItems.value = data.filter(
      (d) => !selectedItems.value.some((s) => s.id === d.id),
    )
  } finally {
    loadingAvailable.value = false
  }
}

function addItem(item: UbigeoOption) {
  selectedItems.value.push(item)
  availableItems.value = availableItems.value.filter((a) => a.id !== item.id)
}

function removeItem(item: UbigeoOption) {
  selectedItems.value = selectedItems.value.filter((s) => s.id !== item.id)
  availableItems.value.push(item)
  availableItems.value.sort((a, b) => a.name.localeCompare(b.name))
}

function getReferenceUbigeoId(): number | null {
  if (selectedLevel.value === 1) return null
  if (selectedLevel.value === 2) return selectedCountry.value
  if (selectedLevel.value === 3) return selectedRegion.value
  if (selectedLevel.value === 4) return selectedProvince.value
  return null
}

async function handleSave() {
  if (!canSave.value) return

  const country = getSelectedCountryCodes()
  const region = getSelectedRegionCodes()
  const province = getSelectedProvinceCodes()

  try {
    isSaving.value = true

    const ubigeos = selectedItems.value.map((item) => ({
      ubigeo_id: item.id,
      codPais: item.codPais ?? country?.codPais ?? 0,
      codDpto: item.codDpto ?? region?.codDpto ?? 0,
      codProv: item.codProv ?? province?.codProv ?? 0,
      codDist: item.codDist ?? 0,
    }))

    await store.createZone({
      name: zoneName.value.trim(),
      level: selectedLevel.value,
      referenceUbigeoId: getReferenceUbigeoId(),
      ubigeos,
    })

    toast.add({
      severity: 'success',
      summary: 'Creada',
      detail: `Zona "${zoneName.value}" creada con ${selectedItems.value.length} localidades`,
      life: 3000,
    })

    router.push('/shipping/zones')
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'Error al crear zona',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  loadingCountries.value = true
  try {
    countries.value = await shippingZonesApi.getCountries()
  } finally {
    loadingCountries.value = false
  }
})
</script>
