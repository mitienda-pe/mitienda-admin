<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-secondary">Mis Tiendas</h1>
        <p class="text-secondary-500 text-sm mt-1">Administra tus tiendas y crea nuevas</p>
      </div>
      <Button
        label="Crear Tienda"
        icon="pi pi-plus"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Loading -->
    <div v-if="authStore.isLoading && !authStore.stores.length" class="text-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      <p class="text-secondary-500 mt-4">Cargando tiendas...</p>
    </div>

    <!-- Store list -->
    <div v-else class="space-y-3">
      <div
        v-for="store in sortedStores"
        :key="store.id"
        class="bg-white rounded-lg border p-4 transition-shadow hover:shadow-md"
        :class="{
          'border-primary ring-1 ring-primary/20': isCurrentStore(store),
          'opacity-60': store.status !== 'active'
        }"
      >
        <div class="flex items-center gap-4">
          <!-- Store icon -->
          <div
            class="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
            :class="store.status === 'active' ? 'bg-primary-50' : 'bg-gray-100'"
          >
            <i
              class="pi pi-shop text-2xl"
              :class="store.status === 'active' ? 'text-primary' : 'text-gray-400'"
            ></i>
          </div>

          <!-- Store info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-secondary truncate">{{ store.name }}</h3>
              <Tag
                v-if="isCurrentStore(store)"
                value="Actual"
                severity="success"
                class="text-xs"
              />
            </div>
            <p class="text-sm text-secondary-500 truncate">{{ store.url || store.slug + '.mitienda.pe' }}</p>
            <div class="flex gap-2 mt-1">
              <Tag
                :value="store.plan"
                severity="info"
                class="text-xs"
              />
              <Tag
                :value="store.status === 'active' ? 'Activa' : 'Vencida'"
                :severity="store.status === 'active' ? 'success' : 'warn'"
                class="text-xs"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="shrink-0">
            <Button
              v-if="!isCurrentStore(store) && store.status === 'active'"
              label="Ingresar"
              icon="pi pi-sign-in"
              size="small"
              outlined
              :loading="switchingStoreId === store.id"
              @click="handleSwitchStore(store)"
            />
            <span
              v-else-if="isCurrentStore(store)"
              class="text-primary text-sm font-medium"
            >
              <i class="pi pi-check-circle mr-1"></i>Conectado
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!authStore.stores.length" class="text-center py-12 bg-white rounded-lg border">
        <i class="pi pi-shop text-4xl text-secondary-300"></i>
        <p class="text-secondary-500 mt-4">No tienes tiendas creadas</p>
        <Button
          label="Crear tu primera tienda"
          icon="pi pi-plus"
          class="mt-4"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Create Store Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      :header="step === 'verify' ? 'Verifica tu correo' : 'Crear Nueva Tienda'"
      :style="{ width: '480px' }"
      modal
      :closable="!isCreating && !isSendingOtp"
    >
      <!-- Paso 2: verificación del correo por código -->
      <div v-if="step === 'verify'" class="space-y-4">
        <p class="text-sm text-secondary">
          Enviamos un código de 6 dígitos a
          <span class="font-medium">{{ maskedRecipient || createForm.email }}</span>.
          Ingrésalo para confirmar tu correo y crear la tienda.
        </p>

        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Código de verificación</label>
          <InputText
            v-model="createForm.code"
            placeholder="123456"
            inputmode="numeric"
            maxlength="6"
            class="w-full tracking-widest text-center"
            :invalid="!!errors.code"
            @input="handleCodeInput"
          />
          <small v-if="errors.code" class="p-error">{{ errors.code }}</small>
        </div>

        <div class="flex items-center justify-between text-sm">
          <button
            type="button"
            class="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            :disabled="isSendingOtp || resendCountdown > 0"
            @click="handleSendOtp(true)"
          >
            {{ resendCountdown > 0 ? `Reenviar código (${resendCountdown}s)` : 'Reenviar código' }}
          </button>
          <button
            type="button"
            class="text-secondary-500 hover:underline"
            :disabled="isCreating"
            @click="backToForm"
          >
            Cambiar datos
          </button>
        </div>

        <Message v-if="createError" severity="error" :closable="false" class="mt-2">
          {{ createError }}
        </Message>
      </div>

      <!-- Paso 1: datos de la tienda -->
      <div v-else class="space-y-4">
        <!-- Store name -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Nombre de la tienda</label>
          <InputText
            v-model="createForm.nombre"
            placeholder="Mi Tienda"
            class="w-full"
            :invalid="!!errors.nombre"
            @input="errors.nombre = ''"
          />
          <small v-if="errors.nombre" class="p-error">{{ errors.nombre }}</small>
        </div>

        <!-- Subdomain -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Subdominio</label>
          <div class="flex items-center">
            <InputText
              v-model="createForm.subdominio"
              placeholder="mi-tienda"
              class="flex-1"
              :invalid="!!errors.subdominio"
              @input="handleSubdomainInput"
            />
            <span class="text-secondary-500 text-sm ml-2 whitespace-nowrap">.mitienda.pe</span>
          </div>
          <small v-if="errors.subdominio" class="p-error">{{ errors.subdominio }}</small>
          <small v-else class="text-secondary-400">Solo letras, números y guiones (3-20 caracteres)</small>
        </div>

        <!-- Country -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">País</label>
          <Dropdown
            v-model="createForm.pais"
            :options="countries"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <!-- Contact email -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Correo de contacto</label>
          <InputText
            v-model="createForm.email"
            placeholder="contacto@mitienda.com"
            type="email"
            class="w-full"
            :invalid="!!errors.email"
            @input="errors.email = ''"
          />
          <small v-if="errors.email" class="p-error">{{ errors.email }}</small>
          <small v-else class="text-secondary-400">Te enviaremos un código para verificarlo</small>
        </div>

        <!-- Contact phone -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Teléfono de contacto</label>
          <InputText
            v-model="createForm.telefono"
            placeholder="999888777"
            inputmode="tel"
            class="w-full"
            :invalid="!!errors.telefono"
            @input="handlePhoneInput"
          />
          <small v-if="errors.telefono" class="p-error">{{ errors.telefono }}</small>
        </div>

        <Message v-if="createError" severity="error" :closable="false" class="mt-2">
          {{ createError }}
        </Message>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          :disabled="isCreating || isSendingOtp"
          @click="showCreateDialog = false"
        />
        <Button
          v-if="step === 'verify'"
          label="Verificar y crear"
          icon="pi pi-check"
          :loading="isCreating"
          @click="handleCreateStore"
        />
        <Button
          v-else
          label="Continuar"
          icon="pi pi-arrow-right"
          :loading="isSendingOtp"
          @click="handleSendOtp(false)"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import type { Store } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Switch store
const switchingStoreId = ref<number | null>(null)

const sortedStores = computed(() => {
  return [...authStore.stores].sort((a, b) => {
    // Current store first
    if (isCurrentStore(a)) return -1
    if (isCurrentStore(b)) return 1
    // Active before inactive
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return a.name.localeCompare(b.name)
  })
})

function isCurrentStore(store: Store) {
  return authStore.selectedStore?.id === store.id
}

async function handleSwitchStore(store: Store) {
  switchingStoreId.value = store.id
  const success = await authStore.selectStore(store)
  switchingStoreId.value = null

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Tienda seleccionada',
      detail: `Ahora estás trabajando en ${store.name}`,
      life: 3000
    })
    router.push('/dashboard')
  }
}

// Create store
const showCreateDialog = ref(false)
const isCreating = ref(false)
const isSendingOtp = ref(false)
const createError = ref('')
const step = ref<'form' | 'verify'>('form')
const sessionId = ref('')
const maskedRecipient = ref('')
const resendCountdown = ref(0)
let resendTimer: ReturnType<typeof setInterval> | null = null

const emptyForm = () => ({
  nombre: '',
  subdominio: '',
  pais: 'PE',
  email: '',
  telefono: '',
  code: ''
})
const createForm = ref(emptyForm())
const errors = ref<Record<string, string>>({})

function startResendCountdown(seconds = 60) {
  resendCountdown.value = seconds
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

function resetCreateDialog() {
  step.value = 'form'
  sessionId.value = ''
  maskedRecipient.value = ''
  createForm.value = emptyForm()
  errors.value = {}
  createError.value = ''
  if (resendTimer) {
    clearInterval(resendTimer)
    resendTimer = null
  }
  resendCountdown.value = 0
}

function backToForm() {
  step.value = 'form'
  createError.value = ''
  errors.value = {}
}

onBeforeUnmount(() => {
  if (resendTimer) clearInterval(resendTimer)
})

watch(showCreateDialog, (open) => {
  if (!open) resetCreateDialog()
})

const countries = [
  { label: 'Perú', value: 'PE' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Colombia', value: 'CO' }
]

function handleSubdomainInput() {
  errors.value.subdominio = ''
  // Auto-clean subdomain
  createForm.value.subdominio = createForm.value.subdominio
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
}

function handlePhoneInput() {
  errors.value.telefono = ''
  createForm.value.telefono = createForm.value.telefono.replace(/\D/g, '')
}

function handleCodeInput() {
  errors.value.code = ''
  createForm.value.code = createForm.value.code.replace(/\D/g, '')
}

// Valida el paso 1 y devuelve los datos limpios (null si hay errores).
function validateForm() {
  errors.value = {}
  createError.value = ''

  if (createForm.value.nombre.trim().length < 3) {
    errors.value.nombre = 'El nombre debe tener al menos 3 caracteres'
    return null
  }

  const sub = createForm.value.subdominio.trim()
  if (!/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/.test(sub)) {
    errors.value.subdominio = 'Debe tener entre 3 y 20 caracteres (letras, números y guiones)'
    return null
  }

  const email = createForm.value.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.value.email = 'Ingresa un correo electrónico válido'
    return null
  }

  const telefono = createForm.value.telefono.trim()
  if (telefono.length < 6 || telefono.length > 15) {
    errors.value.telefono = 'Ingresa un teléfono válido (6 a 15 dígitos)'
    return null
  }

  return { nombre: createForm.value.nombre.trim(), sub, email, telefono }
}

// Paso 1 → envía el código al correo de contacto. `resend` reusa los datos ya validados.
async function handleSendOtp(resend: boolean) {
  const form = validateForm()
  if (!form) return

  isSendingOtp.value = true
  const result = await authStore.sendStoreOtp({ email: form.email, nombre: form.nombre })
  isSendingOtp.value = false

  if (!result) {
    createError.value = authStore.error || 'No se pudo enviar el código de verificación'
    return
  }

  sessionId.value = result.session_id || ''
  maskedRecipient.value = result.masked_recipient || form.email
  createForm.value.code = ''
  step.value = 'verify'
  startResendCountdown()

  toast.add({
    severity: 'success',
    summary: resend ? 'Código reenviado' : 'Código enviado',
    detail: `Revisa ${maskedRecipient.value}`,
    life: 4000
  })
}

// Paso 2 → verifica el código y crea la tienda.
async function handleCreateStore() {
  const form = validateForm()
  if (!form) {
    // Los datos base quedaron inválidos: vuelve al formulario para corregirlos.
    step.value = 'form'
    return
  }

  if (!/^\d{6}$/.test(createForm.value.code)) {
    errors.value.code = 'Ingresa el código de 6 dígitos'
    return
  }

  isCreating.value = true

  const result = await authStore.createStore({
    nombre: form.nombre,
    subdominio: form.sub,
    pais: createForm.value.pais,
    email: form.email,
    telefono: form.telefono,
    session_id_email: sessionId.value,
    code_email: createForm.value.code
  })

  isCreating.value = false

  if (result) {
    // El watch sobre showCreateDialog limpia el formulario al cerrar.
    showCreateDialog.value = false

    toast.add({
      severity: 'success',
      summary: 'Tienda creada',
      detail: `${result.tienda_nombre_comercial} ha sido creada con un plan de prueba de 14 días`,
      life: 5000
    })
  } else {
    createError.value = authStore.error || 'Error al crear la tienda'
  }
}
</script>
