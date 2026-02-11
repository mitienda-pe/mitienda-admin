<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import type { CustomerFormData } from '@/types/customer.types'

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const toast = useToast()

const isEditMode = computed(() => !!route.params.id)
const customerId = computed(() =>
  route.params.id ? parseInt(route.params.id as string) : null
)

const isLoading = ref(false)
const isSaving = ref(false)
const isLookingUp = ref(false)
const errors = ref<Record<string, string>>({})

const documentTypes = [
  { label: 'DNI', value: '1' },
  { label: 'RUC', value: '2' }
]

const formData = ref<CustomerFormData>({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  document_type: '1',
  document_number: '',
  birthdate: null
})

const isRuc = computed(() => formData.value.document_type === '2')

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.first_name.trim()) {
    errors.value.first_name = isRuc.value
      ? 'La razón social es obligatoria'
      : 'El nombre es obligatorio'
  }

  if (!isRuc.value && !formData.value.last_name.trim()) {
    errors.value.last_name = 'Los apellidos son obligatorios'
  }

  if (!formData.value.document_number.trim()) {
    errors.value.document_number = 'El número de documento es obligatorio'
  } else if (formData.value.document_type === '1' && formData.value.document_number.length !== 8) {
    errors.value.document_number = 'El DNI debe tener 8 dígitos'
  } else if (formData.value.document_type === '2' && formData.value.document_number.length !== 11) {
    errors.value.document_number = 'El RUC debe tener 11 dígitos'
  }

  if (formData.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = 'El email no es válido'
  }

  return Object.keys(errors.value).length === 0
}

const lookupDocument = async () => {
  const docNumber = formData.value.document_number.trim()
  const type = formData.value.document_type === '2' ? 'ruc' : 'dni'

  if (type === 'dni' && docNumber.length !== 8) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El DNI debe tener 8 dígitos',
      life: 3000
    })
    return
  }
  if (type === 'ruc' && docNumber.length !== 11) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'El RUC debe tener 11 dígitos',
      life: 3000
    })
    return
  }

  try {
    isLookingUp.value = true
    const result = await customersStore.lookupDocument(docNumber, type)

    if (result) {
      formData.value.first_name = result.first_name
      if (result.last_name) formData.value.last_name = result.last_name
      toast.add({
        severity: 'success',
        summary: 'Encontrado',
        detail: 'Datos completados desde ' + (type === 'dni' ? 'RENIEC' : 'SUNAT'),
        life: 3000
      })
    } else {
      toast.add({
        severity: 'warn',
        summary: 'No encontrado',
        detail: 'No se encontraron datos para este documento',
        life: 3000
      })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al consultar el documento',
      life: 5000
    })
  } finally {
    isLookingUp.value = false
  }
}

const saveCustomer = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Por favor corrige los errores del formulario',
      life: 3000
    })
    return
  }

  try {
    isSaving.value = true

    if (isEditMode.value && customerId.value) {
      await customersStore.updateCustomer(customerId.value, formData.value)
      toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Cliente actualizado exitosamente',
        life: 3000
      })
      router.push({ name: 'CustomerDetail', params: { id: customerId.value } })
    } else {
      const newCustomer = await customersStore.createCustomer(formData.value)
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Cliente creado exitosamente',
        life: 3000
      })
      if (newCustomer?.id) {
        router.push({ name: 'CustomerDetail', params: { id: newCustomer.id } })
      } else {
        router.push({ name: 'Customers' })
      }
    }
  } catch (err: any) {
    const message =
      err.response?.data?.messages?.error ||
      err.response?.data?.message ||
      err.message ||
      'Error al guardar'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const loadCustomer = async () => {
  if (!customerId.value) return

  try {
    isLoading.value = true
    await customersStore.fetchCustomer(customerId.value)
    const customer = customersStore.currentCustomer

    if (customer) {
      // Split name into first_name and last_name (best effort)
      const nameParts = (customer.name || '').trim().split(' ')
      // For names with more parts, assume first 2 words are first name, rest is last name
      // This is imperfect but we'll get the correct data from backend fields
      const firstName = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(' ')
      const lastName = nameParts.slice(Math.ceil(nameParts.length / 2)).join(' ')

      formData.value = {
        first_name: firstName,
        last_name: lastName,
        email: customer.email || '',
        phone: customer.phone || '',
        document_type: customer.document_type || '1',
        document_number: customer.document_number || '',
        birthdate: customer.birthdate || null
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el cliente',
        life: 5000
      })
      router.push({ name: 'Customers' })
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar el cliente',
      life: 5000
    })
    router.push({ name: 'Customers' })
  } finally {
    isLoading.value = false
  }
}

// Clear document number when type changes
watch(
  () => formData.value.document_type,
  () => {
    formData.value.document_number = ''
    formData.value.first_name = ''
    formData.value.last_name = ''
  }
)

onMounted(() => {
  if (isEditMode.value) {
    loadCustomer()
  }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'Customers' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Cliente' : 'Nuevo Cliente' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{
            isEditMode
              ? 'Modifica los datos del cliente'
              : 'Registra un nuevo cliente en tu tienda'
          }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="space-y-6">
      <!-- Documento -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-id-card text-primary"></i>
          Documento
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Tipo de Documento <span class="text-red-500">*</span>
            </label>
            <Dropdown
              v-model="formData.document_type"
              :options="documentTypes"
              option-label="label"
              option-value="value"
              class="w-full"
              :disabled="isEditMode"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Número de Documento <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <InputText
                v-model="formData.document_number"
                class="w-full"
                :class="{ 'p-invalid': errors.document_number }"
                :placeholder="isRuc ? '20XXXXXXXXX' : '12345678'"
                :maxlength="isRuc ? 11 : 8"
              />
              <Button
                icon="pi pi-search"
                :loading="isLookingUp"
                severity="secondary"
                outlined
                @click="lookupDocument"
                v-tooltip.top="'Buscar en ' + (isRuc ? 'SUNAT' : 'RENIEC')"
              />
            </div>
            <small v-if="errors.document_number" class="text-red-500">
              {{ errors.document_number }}
            </small>
          </div>
        </div>
      </div>

      <!-- Datos Personales -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-user text-primary"></i>
          {{ isRuc ? 'Datos de la Empresa' : 'Datos Personales' }}
        </h2>
        <form @submit.prevent="saveCustomer" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                {{ isRuc ? 'Razón Social' : 'Nombres' }} <span class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.first_name"
                class="w-full"
                :class="{ 'p-invalid': errors.first_name }"
                :placeholder="isRuc ? 'Empresa S.A.C.' : 'Juan Carlos'"
              />
              <small v-if="errors.first_name" class="text-red-500">
                {{ errors.first_name }}
              </small>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                {{ isRuc ? 'Nombre de Contacto' : 'Apellidos' }}
                <span v-if="!isRuc" class="text-red-500">*</span>
              </label>
              <InputText
                v-model="formData.last_name"
                class="w-full"
                :class="{ 'p-invalid': errors.last_name }"
                :placeholder="isRuc ? 'Juan Pérez (opcional)' : 'Pérez García'"
              />
              <small v-if="errors.last_name" class="text-red-500">
                {{ errors.last_name }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Email
              </label>
              <InputText
                v-model="formData.email"
                type="email"
                class="w-full"
                :class="{ 'p-invalid': errors.email }"
                placeholder="cliente@ejemplo.com"
              />
              <small v-if="errors.email" class="text-red-500">
                {{ errors.email }}
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Teléfono
              </label>
              <InputText
                v-model="formData.phone"
                class="w-full"
                placeholder="999 999 999"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Fecha de Nacimiento
              </label>
              <InputText
                v-model="formData.birthdate"
                type="date"
                class="w-full"
              />
            </div>
          </div>

          <!-- Botones -->
          <div class="flex justify-end gap-3 pt-4 border-t">
            <Button
              label="Cancelar"
              severity="secondary"
              outlined
              @click="$router.push({ name: 'Customers' })"
            />
            <Button
              :label="isEditMode ? 'Guardar Cambios' : 'Crear Cliente'"
              icon="pi pi-check"
              :loading="isSaving"
              @click="saveCustomer"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
