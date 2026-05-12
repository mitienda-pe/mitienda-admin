<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePosStore } from '@/stores/pos.store'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import InputSwitch from 'primevue/inputswitch'
import { useToast } from 'primevue/usetoast'
import type {
  PosCajeroCreatePayload,
  PosCajeroRol,
  PosCajeroSucursal,
  PosCajeroUpdatePayload
} from '@/types/pos.types'

const route = useRoute()
const router = useRouter()
const store = usePosStore()
const toast = useToast()

const editingId = computed(() => {
  const raw = route.params.id
  if (!raw) return null
  const id = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(id) ? id : null
})
const isEdit = computed(() => editingId.value !== null)

const roles: Array<{ label: string; value: PosCajeroRol }> = [
  { label: 'Cajero', value: 'cajero' },
  { label: 'Supervisor', value: 'supervisor' },
  { label: 'Administrador', value: 'administrador' }
]

interface FormState {
  empleado_nombres: string
  empleado_apellidos: string
  empleado_documento: string
  empleado_email: string
  empleado_telefono: string
  empleado_pin: string
  empleado_rol: PosCajeroRol
  empleado_horario_inicio: string
  empleado_horario_fin: string
  empleado_netsuite_id: string
  empleado_activo: boolean
  sucursales: number[]
}

const form = ref<FormState>({
  empleado_nombres: '',
  empleado_apellidos: '',
  empleado_documento: '',
  empleado_email: '',
  empleado_telefono: '',
  empleado_pin: '',
  empleado_rol: 'cajero',
  empleado_horario_inicio: '',
  empleado_horario_fin: '',
  empleado_netsuite_id: '',
  empleado_activo: true,
  sucursales: []
})

const pinChecking = ref(false)
const pinError = ref<string | null>(null)
const pinAvailable = ref(false)
let pinTimer: ReturnType<typeof setTimeout> | null = null

const loading = ref(false)
const saving = ref(false)

onMounted(async () => {
  loading.value = true
  await store.fetchSucursales()

  if (isEdit.value && editingId.value !== null) {
    await store.fetchCajero(editingId.value)
    const cajero = store.currentCajero
    if (cajero) {
      form.value = {
        empleado_nombres: cajero.empleado_nombres ?? '',
        empleado_apellidos: cajero.empleado_apellidos ?? '',
        empleado_documento: cajero.empleado_documento ?? '',
        empleado_email: cajero.empleado_email ?? '',
        empleado_telefono: cajero.empleado_telefono ?? '',
        empleado_pin: cajero.empleado_pin ?? '',
        empleado_rol: cajero.empleado_rol ?? 'cajero',
        empleado_horario_inicio: (cajero.empleado_horario_inicio ?? '').slice(0, 5),
        empleado_horario_fin: (cajero.empleado_horario_fin ?? '').slice(0, 5),
        empleado_netsuite_id: cajero.empleado_netsuite_id ?? '',
        empleado_activo: Boolean(cajero.empleado_activo),
        sucursales: parseSucursalesIds(cajero.sucursales, cajero.sucursales_ids)
      }
    }
  }

  loading.value = false
})

function parseSucursalesIds(
  sucursales: PosCajeroSucursal[] | undefined,
  ids: number[] | string | undefined
): number[] {
  if (Array.isArray(sucursales) && sucursales.length > 0) {
    return sucursales
      .map(s => Number(s.tiendadireccion_id))
      .filter(n => Number.isFinite(n))
  }
  if (Array.isArray(ids)) {
    return ids.map(Number).filter(n => Number.isFinite(n))
  }
  if (typeof ids === 'string' && ids.length > 0) {
    return ids.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n))
  }
  return []
}

watch(
  () => form.value.empleado_pin,
  (pin) => {
    pinError.value = null
    pinAvailable.value = false

    if (pinTimer) {
      clearTimeout(pinTimer)
      pinTimer = null
    }

    if (!pin) return
    if (!/^\d{4}$/.test(pin)) {
      pinError.value = 'El PIN debe tener exactamente 4 dígitos'
      return
    }

    pinChecking.value = true
    pinTimer = setTimeout(async () => {
      try {
        const result = await store.checkPin(pin, editingId.value)
        if (result && result.available) {
          pinAvailable.value = true
          pinError.value = null
        } else {
          pinAvailable.value = false
          pinError.value = 'El PIN ya está en uso por otro cajero'
        }
      } finally {
        pinChecking.value = false
      }
    }, 500)
  }
)

function buildPayload(): PosCajeroCreatePayload | PosCajeroUpdatePayload {
  return {
    empleado_nombres: form.value.empleado_nombres.trim(),
    empleado_apellidos: form.value.empleado_apellidos.trim(),
    empleado_documento: form.value.empleado_documento.trim() || null,
    empleado_email: form.value.empleado_email.trim() || null,
    empleado_telefono: form.value.empleado_telefono.trim() || null,
    empleado_pin: form.value.empleado_pin,
    empleado_rol: form.value.empleado_rol,
    empleado_horario_inicio: form.value.empleado_horario_inicio || null,
    empleado_horario_fin: form.value.empleado_horario_fin || null,
    empleado_netsuite_id: form.value.empleado_netsuite_id.trim() || null,
    empleado_activo: form.value.empleado_activo ? 1 : 0,
    sucursales: form.value.sucursales
  }
}

function validate(): string | null {
  if (!form.value.empleado_nombres.trim()) return 'Ingresa los nombres'
  if (!form.value.empleado_apellidos.trim()) return 'Ingresa los apellidos'
  if (!/^\d{4}$/.test(form.value.empleado_pin)) return 'El PIN debe tener 4 dígitos'
  if (pinError.value) return pinError.value
  return null
}

async function handleSubmit() {
  const validation = validate()
  if (validation) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: validation, life: 4000 })
    return
  }

  saving.value = true
  try {
    if (isEdit.value && editingId.value !== null) {
      await store.updateCajero(editingId.value, buildPayload())
      toast.add({
        severity: 'success',
        summary: 'Cajero actualizado',
        detail: 'Los cambios fueron guardados',
        life: 3000
      })
    } else {
      await store.createCajero(buildPayload() as Omit<PosCajeroCreatePayload, 'tienda_id'>)
      toast.add({
        severity: 'success',
        summary: 'Cajero creado',
        detail: 'El nuevo cajero ya puede iniciar sesión en el POS',
        life: 3000
      })
    }
    router.push('/pos/cajeros')
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.response?.data?.message || e?.message || 'No se pudo guardar',
      life: 5000
    })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push('/pos/cajeros')
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="handleCancel"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-800">
          {{ isEdit ? 'Editar cajero' : 'Nuevo cajero' }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ isEdit ? 'Modifica los datos y la asignación de sucursales' : 'Crea un cajero con acceso al POS mediante PIN' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Datos personales -->
      <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Datos personales</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
            <InputText v-model="form.empleado_nombres" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
            <InputText v-model="form.empleado_apellidos" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Documento (DNI/CE)</label>
            <InputText v-model="form.empleado_documento" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <InputText v-model="form.empleado_email" type="email" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <InputText v-model="form.empleado_telefono" class="w-full" />
          </div>
        </div>
      </section>

      <!-- Acceso al POS -->
      <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Acceso al POS</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">PIN (4 dígitos) *</label>
            <div class="relative">
              <InputText
                v-model="form.empleado_pin"
                maxlength="4"
                inputmode="numeric"
                class="w-full"
                :class="{ 'p-invalid': pinError }"
              />
              <span v-if="pinChecking" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                <i class="pi pi-spin pi-spinner" />
              </span>
              <span
                v-else-if="pinAvailable && !pinError"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-green-500"
              >
                <i class="pi pi-check-circle" />
              </span>
            </div>
            <p v-if="pinError" class="text-xs text-red-600 mt-1">{{ pinError }}</p>
            <p v-else-if="pinAvailable" class="text-xs text-green-600 mt-1">PIN disponible</p>
            <p v-else class="text-xs text-gray-400 mt-1">El PIN debe ser único en la tienda</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
            <Dropdown
              v-model="form.empleado_rol"
              :options="roles"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Horario inicio</label>
            <InputText v-model="form.empleado_horario_inicio" type="time" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Horario fin</label>
            <InputText v-model="form.empleado_horario_fin" type="time" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">NetSuite ID</label>
            <InputText v-model="form.empleado_netsuite_id" class="w-full" />
            <p class="text-xs text-gray-400 mt-1">Para sincronización con NetSuite (opcional)</p>
          </div>
          <div class="flex items-center gap-3 pt-7">
            <InputSwitch v-model="form.empleado_activo" />
            <span class="text-sm font-medium text-gray-700">Cajero activo</span>
          </div>
        </div>
      </section>

      <!-- Sucursales asignadas -->
      <section class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Sucursales asignadas</h2>
          <p class="text-sm text-gray-500 mt-1">
            Marca las sucursales en las que este cajero puede operar.
          </p>
        </div>

        <div v-if="!store.sucursales.length" class="text-sm text-gray-400 italic">
          No hay sucursales registradas. Crea una en
          <router-link to="/store/addresses" class="text-primary hover:underline">
            Tu Tienda → Direcciones
          </router-link>.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            v-for="branch in store.sucursales"
            :key="branch.tiendadireccion_id"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/40 cursor-pointer"
          >
            <Checkbox
              v-model="form.sucursales"
              :value="branch.tiendadireccion_id"
            />
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-800">
                {{ branch.tiendadireccion_nombresucursal }}
              </p>
              <p class="text-xs text-gray-500">
                {{ branch.tiendadireccion_numero_cajas }} caja(s)
              </p>
            </div>
          </label>
        </div>
      </section>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button label="Cancelar" text severity="secondary" @click="handleCancel" />
        <Button
          :label="isEdit ? 'Guardar cambios' : 'Crear cajero'"
          icon="pi pi-check"
          type="submit"
          :loading="saving"
        />
      </div>
    </form>
  </div>
</template>
