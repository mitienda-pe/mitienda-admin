<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'store-addresses' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Dirección' : 'Nueva Dirección' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los datos de la dirección' : 'Agrega una nueva dirección o sucursal' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="space-y-6">

      <!-- Datos principales -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-map-marker text-primary"></i>
          Datos de la Dirección
        </h2>
        <form @submit.prevent="saveAddress" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Nombre de Sucursal <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.tiendadireccion_nombresucursal"
                class="w-full"
                :class="{ 'p-invalid': errors.tiendadireccion_nombresucursal }"
                placeholder="Ej: Sede Principal, Sucursal Miraflores"
              />
              <small v-if="errors.tiendadireccion_nombresucursal" class="text-red-500">
                {{ errors.tiendadireccion_nombresucursal }}
              </small>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Dirección <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.tiendadireccion_direccion"
                class="w-full"
                :class="{ 'p-invalid': errors.tiendadireccion_direccion }"
                placeholder="Av. ejemplo 123"
              />
              <small v-if="errors.tiendadireccion_direccion" class="text-red-500">
                {{ errors.tiendadireccion_direccion }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Interior / Oficina
              </label>
              <InputText
                v-model="formData.tiendadireccion_interior"
                class="w-full"
                placeholder="Piso 2, Oficina 201"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Teléfono
              </label>
              <InputText
                v-model="formData.tiendadireccion_telefono"
                class="w-full"
                placeholder="(01) 123-4567"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Referencia / Horario de atención
              </label>
              <Textarea
                v-model="formData.tiendadireccion_referencia"
                class="w-full"
                rows="2"
                placeholder="Ej: A una cuadra del parque Kennedy. Lunes a Sábado 9am-7pm"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Ubicación -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-compass text-primary"></i>
          Ubicación
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              País
            </label>
            <Dropdown
              v-model="selectedCountryId"
              :options="countries"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar país"
              class="w-full"
              :loading="loadingCountries"
              @change="onCountryChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Departamento
            </label>
            <Dropdown
              v-model="selectedDepartmentId"
              :options="departments"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar departamento"
              class="w-full"
              :loading="loadingDepartments"
              :disabled="!selectedCountryId"
              filter
              @change="onDepartmentChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Provincia
            </label>
            <Dropdown
              v-model="selectedProvinceId"
              :options="provinces"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar provincia"
              class="w-full"
              :loading="loadingProvinces"
              :disabled="!selectedDepartmentId"
              filter
              @change="onProvinceChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Distrito
            </label>
            <Dropdown
              v-model="selectedDistrictId"
              :options="districts"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar distrito"
              class="w-full"
              :loading="loadingDistricts"
              :disabled="!selectedProvinceId"
              filter
              @change="onDistrictChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Latitud
            </label>
            <InputText
              v-model="formData.tiendadireccion_latitud"
              class="w-full"
              placeholder="-12.1191"
              @change="updateMapFromInputs"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Longitud
            </label>
            <InputText
              v-model="formData.tiendadireccion_longitud"
              class="w-full"
              placeholder="-77.0353"
              @change="updateMapFromInputs"
            />
          </div>
        </div>

        <!-- Mapa -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Mapa
          </label>
          <p class="text-xs text-secondary-400 mb-2">Haz clic en el mapa para establecer la ubicación</p>
          <div ref="mapContainer" class="w-full h-[400px] rounded-lg border border-gray-200 z-0"></div>
        </div>
      </div>

      <!-- Opciones -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-cog text-primary"></i>
          Opciones
        </h2>
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <InputSwitch v-model="isPublished" />
            <div>
              <span class="text-secondary-700 font-medium">Dirección publicada</span>
              <p class="text-xs text-secondary-400">Visible en tu tienda online</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <InputSwitch v-model="isPickupPoint" />
            <div>
              <span class="text-secondary-700 font-medium">Punto de recojo</span>
              <p class="text-xs text-secondary-400">Los clientes pueden recoger pedidos aquí</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-3">
        <Button
          label="Cancelar"
          text
          severity="secondary"
          @click="$router.push({ name: 'store-addresses' })"
        />
        <Button
          :label="isEditMode ? 'Guardar Cambios' : 'Crear Dirección'"
          icon="pi pi-check"
          :loading="storeInfoStore.isSaving"
          @click="saveAddress"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStoreInfoStore } from '@/stores/store-info.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import { shippingZonesApi } from '@/api/shipping-zones.api'
import type { UbigeoOption } from '@/types/shipping-zone.types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { StoreAddressCreateRequest } from '@/types/store.types'

// Fix Leaflet default marker icons (broken by bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

const route = useRoute()
const router = useRouter()
const storeInfoStore = useStoreInfoStore()
const toast = useToast()

const isLoading = ref(false)
const errors = ref<Record<string, string>>({})

// Map
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

const DEFAULT_LAT = -12.0464
const DEFAULT_LNG = -77.0428
const DEFAULT_ZOOM = 13

// Ubigeo cascading selects
const countries = ref<UbigeoOption[]>([])
const departments = ref<UbigeoOption[]>([])
const provinces = ref<UbigeoOption[]>([])
const districts = ref<UbigeoOption[]>([])

const selectedCountryId = ref<number | null>(null)
const selectedDepartmentId = ref<number | null>(null)
const selectedProvinceId = ref<number | null>(null)
const selectedDistrictId = ref<number | null>(null)

const loadingCountries = ref(false)
const loadingDepartments = ref(false)
const loadingProvinces = ref(false)
const loadingDistricts = ref(false)

const getSelectedCountry = () => countries.value.find(c => c.id === selectedCountryId.value)
const getSelectedDepartment = () => departments.value.find(d => d.id === selectedDepartmentId.value)
const getSelectedProvince = () => provinces.value.find(p => p.id === selectedProvinceId.value)

const onCountryChange = async () => {
  selectedDepartmentId.value = null
  selectedProvinceId.value = null
  selectedDistrictId.value = null
  departments.value = []
  provinces.value = []
  districts.value = []
  formData.value.tiendadireccion_dpto = ''
  formData.value.tiendadireccion_prov = ''
  formData.value.tiendadireccion_dist = ''
  formData.value.tiendadireccion_ubigeo = null

  const country = getSelectedCountry()
  if (!country) return
  formData.value.tiendadireccion_pais = country.name

  loadingDepartments.value = true
  try {
    departments.value = await shippingZonesApi.getRegions(country.codPais)
  } finally {
    loadingDepartments.value = false
  }
}

const onDepartmentChange = async () => {
  selectedProvinceId.value = null
  selectedDistrictId.value = null
  provinces.value = []
  districts.value = []
  formData.value.tiendadireccion_prov = ''
  formData.value.tiendadireccion_dist = ''
  formData.value.tiendadireccion_ubigeo = null

  const country = getSelectedCountry()
  const dept = getSelectedDepartment()
  if (!country || !dept) return
  formData.value.tiendadireccion_dpto = dept.name

  loadingProvinces.value = true
  try {
    provinces.value = await shippingZonesApi.getProvinces(country.codPais, dept.codDpto!)
  } finally {
    loadingProvinces.value = false
  }
}

const onProvinceChange = async () => {
  selectedDistrictId.value = null
  districts.value = []
  formData.value.tiendadireccion_dist = ''
  formData.value.tiendadireccion_ubigeo = null

  const country = getSelectedCountry()
  const dept = getSelectedDepartment()
  const prov = getSelectedProvince()
  if (!country || !dept || !prov) return
  formData.value.tiendadireccion_prov = prov.name

  loadingDistricts.value = true
  try {
    districts.value = await shippingZonesApi.getDistricts(country.codPais, dept.codDpto!, prov.codProv!)
  } finally {
    loadingDistricts.value = false
  }
}

const onDistrictChange = () => {
  const dist = districts.value.find(d => d.id === selectedDistrictId.value)
  if (dist) {
    formData.value.tiendadireccion_dist = dist.name
    formData.value.tiendadireccion_ubigeo = dist.id
  }
}

const formData = ref<StoreAddressCreateRequest>({
  tiendadireccion_nombresucursal: '',
  tiendadireccion_direccion: '',
  tiendadireccion_interior: '',
  tiendadireccion_referencia: '',
  tiendadireccion_telefono: '',
  tiendadireccion_pais: '',
  tiendadireccion_dpto: '',
  tiendadireccion_prov: '',
  tiendadireccion_dist: '',
  tiendadireccion_latitud: '',
  tiendadireccion_longitud: '',
  tiendadireccion_ubigeo: null,
  tiendadireccion_swpublicado: 1,
  tiendadireccion_swalmacen: 0
})

const isPublished = ref(true)
const isPickupPoint = ref(false)

// Sync toggles with formData
watch(isPublished, (value) => {
  formData.value.tiendadireccion_swpublicado = value ? 1 : 0
})
watch(isPickupPoint, (value) => {
  formData.value.tiendadireccion_swalmacen = value ? 1 : 0
})

const isEditMode = computed(() => !!route.params.id)
const addressId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.tiendadireccion_nombresucursal || formData.value.tiendadireccion_nombresucursal.trim().length < 2) {
    errors.value.tiendadireccion_nombresucursal = 'El nombre de sucursal es requerido (mínimo 2 caracteres)'
  }

  if (!formData.value.tiendadireccion_direccion || formData.value.tiendadireccion_direccion.trim().length < 5) {
    errors.value.tiendadireccion_direccion = 'La dirección es requerida (mínimo 5 caracteres)'
  }

  return Object.keys(errors.value).length === 0
}

const saveAddress = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Por favor completa los campos requeridos',
      life: 3000
    })
    return
  }

  try {
    if (isEditMode.value && addressId.value) {
      await storeInfoStore.updateAddress(addressId.value, formData.value)

      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'La dirección ha sido actualizada correctamente',
        life: 3000
      })
    } else {
      await storeInfoStore.createAddress(formData.value)

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'La dirección ha sido creada correctamente',
        life: 3000
      })
    }

    router.push({ name: 'store-addresses' })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.messages
        ? Object.values(error.response.data.messages).join(', ')
        : error.response?.data?.message || 'Error al guardar la dirección',
      life: 5000
    })
  }
}

const loadAddress = async () => {
  if (!addressId.value) return

  try {
    isLoading.value = true
    const address = await storeInfoStore.fetchAddress(addressId.value)

    if (address) {
      formData.value = {
        tiendadireccion_nombresucursal: address.tiendadireccion_nombresucursal || '',
        tiendadireccion_direccion: address.tiendadireccion_direccion || '',
        tiendadireccion_interior: address.tiendadireccion_interior || '',
        tiendadireccion_referencia: address.tiendadireccion_referencia || '',
        tiendadireccion_telefono: address.tiendadireccion_telefono || '',
        tiendadireccion_pais: address.tiendadireccion_pais || '',
        tiendadireccion_dpto: address.tiendadireccion_dpto || '',
        tiendadireccion_prov: address.tiendadireccion_prov || '',
        tiendadireccion_dist: address.tiendadireccion_dist || '',
        tiendadireccion_latitud: address.tiendadireccion_latitud || '',
        tiendadireccion_longitud: address.tiendadireccion_longitud || '',
        tiendadireccion_ubigeo: address.tiendadireccion_ubigeo || null,
        tiendadireccion_swpublicado: address.tiendadireccion_swpublicado,
        tiendadireccion_swalmacen: address.tiendadireccion_swalmacen
      }
      isPublished.value = address.tiendadireccion_swpublicado == 1
      isPickupPoint.value = address.tiendadireccion_swalmacen == 1
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la dirección',
        life: 5000
      })
      router.push({ name: 'store-addresses' })
    }
  } finally {
    isLoading.value = false
  }
}

const loadUbigeoSelects = async () => {
  loadingCountries.value = true
  try {
    countries.value = await shippingZonesApi.getCountries()
  } finally {
    loadingCountries.value = false
  }

  // In edit mode, cascade selects based on existing text values
  if (isEditMode.value && formData.value.tiendadireccion_pais) {
    const countryMatch = countries.value.find(c =>
      c.name.toLowerCase() === (formData.value.tiendadireccion_pais || '').toLowerCase()
    )
    if (countryMatch) {
      selectedCountryId.value = countryMatch.id

      loadingDepartments.value = true
      try {
        departments.value = await shippingZonesApi.getRegions(countryMatch.codPais)
      } finally {
        loadingDepartments.value = false
      }

      if (formData.value.tiendadireccion_dpto) {
        const deptMatch = departments.value.find(d =>
          d.name.toLowerCase() === (formData.value.tiendadireccion_dpto || '').toLowerCase()
        )
        if (deptMatch) {
          selectedDepartmentId.value = deptMatch.id

          loadingProvinces.value = true
          try {
            provinces.value = await shippingZonesApi.getProvinces(countryMatch.codPais, deptMatch.codDpto!)
          } finally {
            loadingProvinces.value = false
          }

          if (formData.value.tiendadireccion_prov) {
            const provMatch = provinces.value.find(p =>
              p.name.toLowerCase() === (formData.value.tiendadireccion_prov || '').toLowerCase()
            )
            if (provMatch) {
              selectedProvinceId.value = provMatch.id

              loadingDistricts.value = true
              try {
                districts.value = await shippingZonesApi.getDistricts(countryMatch.codPais, deptMatch.codDpto!, provMatch.codProv!)
              } finally {
                loadingDistricts.value = false
              }

              if (formData.value.tiendadireccion_dist) {
                const distMatch = districts.value.find(d =>
                  d.name.toLowerCase() === (formData.value.tiendadireccion_dist || '').toLowerCase()
                )
                if (distMatch) {
                  selectedDistrictId.value = distMatch.id
                  formData.value.tiendadireccion_ubigeo = distMatch.id
                }
              }
            }
          }
        }
      }
    }
  }
}

const initMap = () => {
  if (!mapContainer.value || map) return

  const lat = parseFloat(formData.value.tiendadireccion_latitud || '') || DEFAULT_LAT
  const lng = parseFloat(formData.value.tiendadireccion_longitud || '') || DEFAULT_LNG
  const hasCoords = !!(formData.value.tiendadireccion_latitud && formData.value.tiendadireccion_longitud)

  map = L.map(mapContainer.value).setView([lat, lng], hasCoords ? 16 : DEFAULT_ZOOM)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)

  if (hasCoords) {
    marker = L.marker([lat, lng], { draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker!.getLatLng()
      formData.value.tiendadireccion_latitud = pos.lat.toFixed(6)
      formData.value.tiendadireccion_longitud = pos.lng.toFixed(6)
    })
  }

  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat: clickLat, lng: clickLng } = e.latlng
    formData.value.tiendadireccion_latitud = clickLat.toFixed(6)
    formData.value.tiendadireccion_longitud = clickLng.toFixed(6)

    if (marker) {
      marker.setLatLng([clickLat, clickLng])
    } else if (map) {
      marker = L.marker([clickLat, clickLng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const pos = marker!.getLatLng()
        formData.value.tiendadireccion_latitud = pos.lat.toFixed(6)
        formData.value.tiendadireccion_longitud = pos.lng.toFixed(6)
      })
    }
  })
}

const updateMapFromInputs = () => {
  const lat = parseFloat(formData.value.tiendadireccion_latitud || '')
  const lng = parseFloat(formData.value.tiendadireccion_longitud || '')

  if (!isNaN(lat) && !isNaN(lng) && map) {
    map.setView([lat, lng], 16)

    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const pos = marker!.getLatLng()
        formData.value.tiendadireccion_latitud = pos.lat.toFixed(6)
        formData.value.tiendadireccion_longitud = pos.lng.toFixed(6)
      })
    }
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadAddress()
  }
  await loadUbigeoSelects()
  await nextTick()
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
    marker = null
  }
})
</script>
