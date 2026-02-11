<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import type { CustomerAddress, CustomerAddressFormData } from '@/types/customer.types'

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const toast = useToast()
const { formatCurrency, formatDate } = useFormatters()

const customerId = Number(route.params.id)

onMounted(() => {
  customersStore.fetchCustomer(customerId)
})

const customer = computed(() => customersStore.currentCustomer)

// Address dialog state
const showAddressDialog = ref(false)
const isEditingAddress = ref(false)
const editingAddressId = ref<number | null>(null)
const isSavingAddress = ref(false)
const addressForm = ref<CustomerAddressFormData>({
  address: '',
  interior: '',
  reference: '',
  department: '',
  province: '',
  district: '',
  country: 'Perú',
  is_default: false
})
const addressErrors = ref<Record<string, string>>({})

// Delete confirmation
const showDeleteConfirm = ref(false)
const deletingAddressId = ref<number | null>(null)
const isDeletingAddress = ref(false)

const goBack = () => {
  router.push('/customers')
}

const goToEdit = () => {
  router.push({ name: 'CustomerEdit', params: { id: customerId } })
}

const goToOrder = (orderId: number) => {
  router.push(`/orders/${orderId}`)
}

const whatsappUrl = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '')
  const number = cleaned.startsWith('51') ? cleaned : `51${cleaned}`
  return `https://wa.me/${number}`
}

const formatFullAddress = (addr: any) => {
  const parts = [addr.address]
  if (addr.interior) parts.push(`Int. ${addr.interior}`)
  const geo = [addr.district, addr.province, addr.department].filter(Boolean).join(', ')
  if (geo) parts.push(geo)
  return parts.join(' - ')
}

// Address management
const resetAddressForm = () => {
  addressForm.value = {
    address: '',
    interior: '',
    reference: '',
    department: '',
    province: '',
    district: '',
    country: 'Perú',
    is_default: false
  }
  addressErrors.value = {}
  isEditingAddress.value = false
  editingAddressId.value = null
}

const openAddAddress = () => {
  resetAddressForm()
  showAddressDialog.value = true
}

const openEditAddress = (addr: CustomerAddress) => {
  isEditingAddress.value = true
  editingAddressId.value = addr.id
  addressForm.value = {
    address: addr.address || '',
    interior: addr.interior || '',
    reference: addr.reference || '',
    department: addr.department || '',
    province: addr.province || '',
    district: addr.district || '',
    country: addr.country || 'Perú',
    is_default: addr.is_default || false
  }
  addressErrors.value = {}
  showAddressDialog.value = true
}

const validateAddressForm = (): boolean => {
  addressErrors.value = {}
  if (!addressForm.value.address.trim()) {
    addressErrors.value.address = 'La dirección es obligatoria'
  }
  return Object.keys(addressErrors.value).length === 0
}

const saveAddress = async () => {
  if (!validateAddressForm()) return

  try {
    isSavingAddress.value = true
    if (isEditingAddress.value && editingAddressId.value) {
      await customersStore.updateAddress(customerId, editingAddressId.value, addressForm.value)
      toast.add({
        severity: 'success',
        summary: 'Actualizada',
        detail: 'Dirección actualizada exitosamente',
        life: 3000
      })
    } else {
      await customersStore.addAddress(customerId, addressForm.value)
      toast.add({
        severity: 'success',
        summary: 'Agregada',
        detail: 'Dirección agregada exitosamente',
        life: 3000
      })
    }
    showAddressDialog.value = false
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Error al guardar dirección',
      life: 5000
    })
  } finally {
    isSavingAddress.value = false
  }
}

const confirmDeleteAddress = (addressId: number) => {
  deletingAddressId.value = addressId
  showDeleteConfirm.value = true
}

const deleteAddress = async () => {
  if (!deletingAddressId.value) return

  try {
    isDeletingAddress.value = true
    await customersStore.deleteAddress(customerId, deletingAddressId.value)
    toast.add({
      severity: 'success',
      summary: 'Eliminada',
      detail: 'Dirección eliminada exitosamente',
      life: 3000
    })
    showDeleteConfirm.value = false
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Error al eliminar dirección',
      life: 5000
    })
  } finally {
    isDeletingAddress.value = false
  }
}

const setDefaultAddress = async (addressId: number) => {
  try {
    await customersStore.setDefaultAddress(customerId, addressId)
    toast.add({
      severity: 'success',
      summary: 'Actualizada',
      detail: 'Dirección predeterminada actualizada',
      life: 3000
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Error al actualizar dirección',
      life: 5000
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button
          icon="pi pi-arrow-left"
          text
          rounded
          @click="goBack"
        />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ customer?.name || 'Cliente' }}
          </h1>
          <p v-if="customer" class="text-gray-600 mt-1">
            Cliente desde {{ formatDate(customer.created_at) }}
          </p>
        </div>
      </div>
      <div v-if="customer" class="flex items-center gap-2">
        <Tag v-if="customer.verified" severity="success" value="Verificado" icon="pi pi-check-circle" />
        <Tag v-if="customer.blocked" severity="danger" value="Bloqueado" icon="pi pi-ban" />
        <Button
          label="Editar"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          @click="goToEdit"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="customersStore.isLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="customersStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ customersStore.error }}</p>
      <Button
        label="Volver a clientes"
        icon="pi pi-arrow-left"
        class="mt-4"
        @click="goBack"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!customer"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-user text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Cliente no encontrado</h3>
      <p class="text-gray-600 mb-4">El cliente que buscas no existe o ha sido eliminado</p>
      <Button
        label="Volver a clientes"
        icon="pi pi-arrow-left"
        @click="goBack"
      />
    </div>

    <!-- Contenido del Cliente -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna Principal -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Pedidos del Cliente -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-shopping-cart text-primary"></i>
              Historial de Pedidos
            </div>
          </template>
          <template #content>
            <div v-if="customer.orders && customer.orders.length > 0">
              <DataTable :value="customer.orders" striped-rows>
                <Column field="order_number" header="Número de Pedido">
                  <template #body="slotProps">
                    <Button
                      :label="`#${slotProps.data.order_number}`"
                      link
                      @click="goToOrder(slotProps.data.id)"
                    />
                  </template>
                </Column>
                <Column field="created_at" header="Fecha">
                  <template #body="slotProps">
                    {{ formatDate(slotProps.data.created_at) }}
                  </template>
                </Column>
                <Column field="status" header="Estado">
                  <template #body="slotProps">
                    <Tag
                      :value="slotProps.data.status"
                      :severity="
                        slotProps.data.status === 'delivered' ? 'success' :
                        slotProps.data.status === 'cancelled' ? 'danger' :
                        slotProps.data.status === 'shipped' ? 'info' : 'warning'
                      "
                    />
                  </template>
                </Column>
                <Column field="total" header="Total">
                  <template #body="slotProps">
                    {{ formatCurrency(slotProps.data.total) }}
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="text-center py-8">
              <i class="pi pi-shopping-cart text-4xl text-gray-300 mb-2"></i>
              <p class="text-gray-500">Este cliente aún no ha realizado pedidos</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar: Información del Cliente -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Información Personal -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              Información Personal
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Nombre completo</p>
                <p class="font-semibold text-gray-900">{{ customer.name }}</p>
              </div>
              <div v-if="customer.email">
                <p class="text-sm text-gray-500">Email</p>
                <a
                  :href="`mailto:${customer.email}`"
                  class="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <i class="pi pi-envelope text-sm"></i>
                  {{ customer.email }}
                </a>
              </div>
              <div>
                <p class="text-sm text-gray-500">Teléfono</p>
                <a
                  v-if="customer.phone"
                  :href="whatsappUrl(customer.phone)"
                  target="_blank"
                  rel="noopener"
                  class="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <i class="pi pi-whatsapp text-sm"></i>
                  {{ customer.phone }}
                </a>
                <p v-else class="text-gray-400 italic">No registrado</p>
              </div>
              <div v-if="customer.document_number">
                <p class="text-sm text-gray-500">Documento</p>
                <p class="font-semibold text-gray-900">{{ customer.document_number }}</p>
              </div>
              <div v-if="customer.birthdate">
                <p class="text-sm text-gray-500">Fecha de nacimiento</p>
                <p class="font-semibold text-gray-900">{{ formatDate(customer.birthdate) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Direcciones -->
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="pi pi-map-marker text-primary"></i>
                Direcciones
                <span v-if="customer.addresses?.length" class="text-sm font-normal text-gray-500">
                  ({{ customer.addresses.length }})
                </span>
              </div>
              <Button
                icon="pi pi-plus"
                text
                rounded
                size="small"
                v-tooltip.top="'Agregar dirección'"
                @click="openAddAddress"
              />
            </div>
          </template>
          <template #content>
            <div v-if="customer.addresses && customer.addresses.length > 0" class="space-y-3">
              <div
                v-for="addr in customer.addresses"
                :key="addr.id"
                class="border border-gray-100 rounded-lg p-3"
                :class="{ 'border-primary bg-primary/5': addr.is_default }"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">{{ formatFullAddress(addr) }}</p>
                    <p v-if="addr.reference" class="text-xs text-gray-500 mt-1">
                      Ref: {{ addr.reference }}
                    </p>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <Tag
                      v-if="addr.is_default"
                      severity="info"
                      value="Principal"
                      class="shrink-0"
                    />
                    <Button
                      v-if="!addr.is_default"
                      icon="pi pi-star"
                      text
                      rounded
                      size="small"
                      severity="secondary"
                      v-tooltip.top="'Establecer como principal'"
                      @click="setDefaultAddress(addr.id)"
                    />
                    <Button
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      severity="secondary"
                      v-tooltip.top="'Editar'"
                      @click="openEditAddress(addr)"
                    />
                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      v-tooltip.top="'Eliminar'"
                      @click="confirmDeleteAddress(addr.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-4">
              <p class="text-gray-400 italic mb-2">Sin direcciones registradas</p>
              <Button
                label="Agregar Dirección"
                icon="pi pi-plus"
                size="small"
                outlined
                @click="openAddAddress"
              />
            </div>
          </template>
        </Card>

        <!-- Estadísticas -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-chart-bar text-primary"></i>
              Estadísticas
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">Total de pedidos</span>
                <span class="font-bold text-lg text-primary">
                  {{ customer.total_orders || customer.orders?.length || 0 }}
                </span>
              </div>
              <div v-if="customer.total_spent" class="flex justify-between items-center">
                <span class="text-sm text-gray-500">Total gastado</span>
                <span class="font-bold text-lg text-green-600">
                  {{ formatCurrency(customer.total_spent) }}
                </span>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Address Dialog -->
    <Dialog
      v-model:visible="showAddressDialog"
      :header="isEditingAddress ? 'Editar Dirección' : 'Nueva Dirección'"
      modal
      :style="{ width: '500px' }"
      :closable="!isSavingAddress"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Dirección <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="addressForm.address"
            class="w-full"
            :class="{ 'p-invalid': addressErrors.address }"
            placeholder="Av. Ejemplo 123"
          />
          <small v-if="addressErrors.address" class="text-red-500">
            {{ addressErrors.address }}
          </small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Interior / Oficina
            </label>
            <InputText
              v-model="addressForm.interior"
              class="w-full"
              placeholder="Piso 2, Of. 201"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Referencia
            </label>
            <InputText
              v-model="addressForm.reference"
              class="w-full"
              placeholder="Frente al parque"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Departamento
            </label>
            <InputText
              v-model="addressForm.department"
              class="w-full"
              placeholder="Lima"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Provincia
            </label>
            <InputText
              v-model="addressForm.province"
              class="w-full"
              placeholder="Lima"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Distrito
            </label>
            <InputText
              v-model="addressForm.district"
              class="w-full"
              placeholder="Miraflores"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            v-model="addressForm.is_default"
            :binary="true"
            input-id="is_default"
          />
          <label for="is_default" class="text-sm text-secondary-700 cursor-pointer">
            Establecer como dirección principal
          </label>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            :disabled="isSavingAddress"
            @click="showAddressDialog = false"
          />
          <Button
            :label="isEditingAddress ? 'Guardar' : 'Agregar'"
            icon="pi pi-check"
            :loading="isSavingAddress"
            @click="saveAddress"
          />
        </div>
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteConfirm"
      header="Confirmar eliminación"
      modal
      :style="{ width: '400px' }"
      :closable="!isDeletingAddress"
    >
      <p class="text-gray-700">
        ¿Estás seguro de que deseas eliminar esta dirección? Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            :disabled="isDeletingAddress"
            @click="showDeleteConfirm = false"
          />
          <Button
            label="Eliminar"
            severity="danger"
            icon="pi pi-trash"
            :loading="isDeletingAddress"
            @click="deleteAddress"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
