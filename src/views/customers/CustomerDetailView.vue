<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers.store'
import { useFormatters } from '@/composables/useFormatters'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const { formatCurrency, formatDate } = useFormatters()

const customerId = Number(route.params.id)

onMounted(() => {
  customersStore.fetchCustomer(customerId)
})

const customer = computed(() => customersStore.currentCustomer)

const goBack = () => {
  router.push('/customers')
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
      <div v-if="customer" class="flex gap-2">
        <Tag v-if="customer.verified" severity="success" value="Verificado" icon="pi pi-check-circle" />
        <Tag v-if="customer.blocked" severity="danger" value="Bloqueado" icon="pi pi-ban" />
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
              <div v-if="customer.phone">
                <p class="text-sm text-gray-500">Teléfono</p>
                <a
                  :href="whatsappUrl(customer.phone)"
                  target="_blank"
                  rel="noopener"
                  class="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <i class="pi pi-whatsapp text-sm"></i>
                  {{ customer.phone }}
                </a>
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
        <Card v-if="customer.addresses && customer.addresses.length > 0">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-map-marker text-primary"></i>
              Direcciones ({{ customer.addresses.length }})
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div
                v-for="addr in customer.addresses"
                :key="addr.id"
                class="border border-gray-100 rounded-lg p-3"
                :class="{ 'border-primary bg-primary/5': addr.is_default }"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="text-sm text-gray-900">{{ formatFullAddress(addr) }}</p>
                  <Tag
                    v-if="addr.is_default"
                    severity="info"
                    value="Principal"
                    class="shrink-0"
                  />
                </div>
                <p v-if="addr.reference" class="text-xs text-gray-500 mt-1">
                  Ref: {{ addr.reference }}
                </p>
              </div>
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
  </div>
</template>
