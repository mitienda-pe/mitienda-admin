<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useStoreConfigStore } from '@/stores/store-config.store'
import { IMAGE_VALIDATION_RULES } from '@/config/image-validation.config'
import { AppButton } from '@/components/ui'
import BrandingUploader from '@/components/appearance/BrandingUploader.vue'
import StoreScheduleEditor from '@/components/store/StoreScheduleEditor.vue'
import InputSwitch from 'primevue/inputswitch'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import type { StoreScheduleDay } from '@/types/store.types'

const store = useStoreConfigStore()
const toast = useToast()

const bannerRules = IMAGE_VALIDATION_RULES.storeDisabledBanner

const DEFAULT_SCHEDULE: StoreScheduleDay[] = [
  { day: 'lunes', active: true, open: '09:00', close: '18:00' },
  { day: 'martes', active: true, open: '09:00', close: '18:00' },
  { day: 'miercoles', active: true, open: '09:00', close: '18:00' },
  { day: 'jueves', active: true, open: '09:00', close: '18:00' },
  { day: 'viernes', active: true, open: '09:00', close: '18:00' },
  { day: 'sabado', active: true, open: '09:00', close: '13:00' },
  { day: 'domingo', active: false, open: '09:00', close: '13:00' }
]

const schedule = computed<StoreScheduleDay[]>({
  get() {
    const json = store.draftConfig.tiendageneral_json_horarioActivo
    if (json) {
      try {
        return JSON.parse(json)
      } catch {
        return DEFAULT_SCHEDULE
      }
    }
    return DEFAULT_SCHEDULE
  },
  set(val: StoreScheduleDay[]) {
    store.updateField('tiendageneral_json_horarioActivo', JSON.stringify(val))
  }
})

const isStoreActive = computed({
  get: () => store.draftConfig.sw_tienda_visible === 1,
  set: (val: boolean) => store.updateField('sw_tienda_visible', val ? 1 : 0)
})

const isScheduleEnabled = computed({
  get: () => store.draftConfig.tiendageneral_sw_horarioActivo === 1,
  set: (val: boolean) => {
    store.updateField('tiendageneral_sw_horarioActivo', val ? 1 : 0)
    if (val && !store.draftConfig.tiendageneral_json_horarioActivo) {
      store.updateField('tiendageneral_json_horarioActivo', JSON.stringify(DEFAULT_SCHEDULE))
    }
  }
})

const STORE_TYPE_OPTIONS = [
  {
    value: 0,
    label: 'Abierta sin registro',
    description: 'Cualquier visitante puede comprar sin crear cuenta'
  },
  {
    value: 1,
    label: 'Abierta con registro obligatorio',
    description: 'Requiere crear cuenta para poder comprar'
  },
  {
    value: 2,
    label: 'Cerrada',
    description: 'Solo usuarios registrados pueden ver y comprar'
  }
]

// Initialize schedule JSON when enabling for first time
watch(isScheduleEnabled, val => {
  if (val && !store.draftConfig.tiendageneral_json_horarioActivo) {
    store.updateField('tiendageneral_json_horarioActivo', JSON.stringify(DEFAULT_SCHEDULE))
  }
})

async function save() {
  const ok = await store.saveConfig()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Configuración guardada', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error, life: 5000 })
  }
}

async function handleBannerUpload(file: File) {
  const ok = await store.uploadBanner(file)
  if (ok) {
    toast.add({ severity: 'success', summary: 'Banner actualizado', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error, life: 5000 })
  }
}

async function handleBannerDelete() {
  const ok = await store.deleteBanner()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Banner eliminado', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error, life: 5000 })
  }
}

onMounted(() => {
  Promise.all([store.fetchConfig(), store.fetchCurrencies(), store.fetchCountries()])
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Configuración</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Idioma, moneda, límites de compra y estado de la tienda
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Card 1: General -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-globe text-primary" />
          General
        </h2>

        <div class="space-y-5">
          <!-- Idioma -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Idioma</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="idioma"
                  value="spanish"
                  :checked="store.draftConfig.tiendageneral_idioma === 'spanish'"
                  class="text-primary focus:ring-primary"
                  @change="store.updateField('tiendageneral_idioma', 'spanish')"
                />
                <span class="text-sm text-gray-700">Español</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="idioma"
                  value="english"
                  :checked="store.draftConfig.tiendageneral_idioma === 'english'"
                  class="text-primary focus:ring-primary"
                  @change="store.updateField('tiendageneral_idioma', 'english')"
                />
                <span class="text-sm text-gray-700">Inglés</span>
              </label>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Moneda -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Moneda</label>
            <div class="flex flex-wrap gap-4">
              <label
                v-for="currency in store.currencies"
                :key="currency.moneda_id"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="moneda"
                  :value="currency.moneda_id"
                  :checked="store.draftConfig.moneda_id === currency.moneda_id"
                  class="text-primary focus:ring-primary"
                  @change="store.updateField('moneda_id', currency.moneda_id)"
                />
                <span class="text-sm text-gray-700">
                  {{ currency.moneda_nombre }} ({{ currency.moneda_simbolo }})
                </span>
              </label>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- País -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              País predeterminado
            </label>
            <Dropdown
              :modelValue="store.draftConfig.tiendageneral_paisorigen"
              :options="store.countries"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecciona un país"
              class="w-full md:w-80"
              @update:modelValue="store.updateField('tiendageneral_paisorigen', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Compras -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-shopping-cart text-primary" />
          Compras
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Compra mínima -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Compra mínima
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Monto mínimo para realizar un pedido. Dejar vacío para no aplicar.
            </p>
            <InputNumber
              :modelValue="store.draftConfig.tiendageneral_montominimo"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              :min="0"
              :prefix="store.currentCurrencySymbol + ' '"
              placeholder="Sin mínimo"
              class="w-full"
              @update:modelValue="store.updateField('tiendageneral_montominimo', $event)"
            />
          </div>

          <!-- Compra máxima -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Compra máxima
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Monto máximo permitido por pedido.
            </p>
            <InputNumber
              :modelValue="store.draftConfig.tiendageneral_montomaximo"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              :min="0"
              :prefix="store.currentCurrencySymbol + ' '"
              placeholder="100,000.00"
              class="w-full"
              @update:modelValue="store.updateField('tiendageneral_montomaximo', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Card 3: Estado de la Tienda -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-shop text-primary" />
          Estado de la Tienda
        </h2>

        <div class="space-y-6">
          <!-- Tipo de tienda -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-3">
              Tipo de tienda
            </label>
            <div class="space-y-3">
              <label
                v-for="option in STORE_TYPE_OPTIONS"
                :key="option.value"
                class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="
                  store.draftConfig.sw_logincliente === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                "
              >
                <input
                  type="radio"
                  name="tipoTienda"
                  :value="option.value"
                  :checked="store.draftConfig.sw_logincliente === option.value"
                  class="mt-0.5 text-primary focus:ring-primary"
                  @change="store.updateField('sw_logincliente', option.value)"
                />
                <div>
                  <span class="text-sm font-medium text-gray-700">{{ option.label }}</span>
                  <p class="text-xs text-gray-400 mt-0.5">{{ option.description }}</p>
                </div>
              </label>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Estado activa/inactiva -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-secondary-700">Estado</label>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ isStoreActive ? 'La tienda está activa y visible' : 'La tienda está temporalmente fuera de servicio' }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="isStoreActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ isStoreActive ? 'Activa' : 'Inactiva' }}
              </span>
              <InputSwitch v-model="isStoreActive" />
            </div>
          </div>

          <!-- Banner tienda desactivada -->
          <div v-if="!isStoreActive">
            <BrandingUploader
              :currentUrl="store.draftConfig.tiendageneral_banner_desactivado_url"
              :isUploading="store.isUploadingBanner"
              :rules="bannerRules"
              label="Banner de tienda desactivada"
              hint="Se muestra cuando la tienda está desactivada. JPG, PNG o WebP."
              @upload="handleBannerUpload"
              @delete="handleBannerDelete"
            />
          </div>

          <hr class="border-gray-100" />

          <!-- Horario -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div>
                <label class="text-sm font-medium text-secondary-700">Horario de atención</label>
                <p class="text-xs text-gray-400 mt-0.5">
                  Establece los horarios en que tu tienda está disponible
                </p>
              </div>
              <InputSwitch v-model="isScheduleEnabled" />
            </div>
            <StoreScheduleEditor
              v-if="isScheduleEnabled"
              :schedule="schedule"
              @update:schedule="schedule = $event"
            />
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="flex items-center gap-3 pb-8">
        <AppButton
          variant="primary"
          :loading="store.isSaving"
          :disabled="!store.hasChanges"
          @click="save"
        >
          <i class="pi pi-check mr-2" />
          Guardar configuración
        </AppButton>
        <span v-if="store.hasChanges" class="text-xs text-amber-600">
          Tienes cambios sin guardar
        </span>
      </div>
    </div>
  </div>
</template>
