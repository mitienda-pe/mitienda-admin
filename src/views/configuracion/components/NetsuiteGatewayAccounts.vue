<template>
  <div>
    <Message severity="info" :closable="false" class="mb-6">
      <div class="flex items-start gap-2">
        <i class="pi pi-info-circle text-lg"></i>
        <div>
          <p class="font-semibold">Cuentas por pasarela (web / storefront)</p>
          <p class="text-sm mt-1">
            Asigne el ID de la cuenta de NetSuite donde entran los pagos de cada
            <strong>pasarela del storefront</strong> (Izipay, Flow, Culqi…). Se usa para registrar
            el prepago como <strong>Customer Deposit</strong> sobre la Orden de Venta, y evitar la
            conciliación manual. Solo mapee las pasarelas que quiera enviar a NetSuite.
          </p>
        </div>
      </div>
    </Message>

    <div class="flex items-center justify-end mb-4">
      <Button
        label="Nueva cuenta"
        icon="pi pi-plus"
        :disabled="availableForCreate.length === 0"
        @click="openCreate"
      />
    </div>

    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-else-if="accounts.length === 0" severity="warn" :closable="false">
      <p class="font-semibold">No hay pasarelas mapeadas.</p>
      <p class="text-sm mt-1">
        Asigne una cuenta NetSuite a las pasarelas del storefront que use la tienda.
      </p>
    </Message>

    <DataTable v-else :value="accounts" stripedRows class="border">
      <Column header="Pasarela" style="min-width: 180px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i class="pi pi-credit-card text-secondary-500"></i>
            <span>{{ data.pasarela_nombre || ('Pasarela #' + data.pasarela_id) }}</span>
          </div>
        </template>
      </Column>

      <Column header="Cuenta NetSuite" style="width: 180px">
        <template #body="{ data }">
          <span class="font-mono text-sm">{{ data.netsuite_account_id }}</span>
        </template>
      </Column>

      <Column header="Estado" style="width: 120px">
        <template #body="{ data }">
          <Tag
            :value="data.estado ? 'Activa' : 'Inactiva'"
            :severity="data.estado ? 'success' : 'secondary'"
          />
        </template>
      </Column>

      <Column header="Acciones" style="width: 130px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" size="small" outlined v-tooltip.top="'Editar'" @click="openEdit(data)" />
            <Button icon="pi pi-trash" size="small" severity="danger" outlined v-tooltip.top="'Desactivar'" @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Message v-if="error" severity="error" :closable="false" class="mt-4">
      {{ error }}
    </Message>

    <!-- Dialog crear/editar -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Editar cuenta de pasarela' : 'Nueva cuenta de pasarela'"
      modal
      :style="{ width: '30rem' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Pasarela *</label>
          <Dropdown
            v-model="form.pasarela_id"
            :options="dialogGatewayOptions"
            optionLabel="pasarela_nombre"
            optionValue="pasarela_id"
            placeholder="Seleccione una pasarela"
            class="w-full"
            :disabled="!!editingId"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">ID de cuenta NetSuite *</label>
          <InputText v-model="form.netsuite_account_id" placeholder="Ej: 10100" class="w-full font-mono" />
          <small class="text-secondary-500">El internal ID de la cuenta (banco / activo corriente) en NetSuite.</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" icon="pi pi-save" :loading="isSaving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { netsuiteApi } from '@/api/netsuite.api'
import type { NetsuiteGatewayAccount, AvailableGateway } from '@/types/netsuite.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{
  tiendaId: number | null
}>()

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

const accounts = ref<NetsuiteGatewayAccount[]>([])
const gateways = ref<AvailableGateway[]>([])

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const editingRow = ref<NetsuiteGatewayAccount | null>(null)

const form = ref<{ pasarela_id: number | null; netsuite_account_id: string }>({
  pasarela_id: null,
  netsuite_account_id: ''
})

// Al crear: solo pasarelas que aún no tienen mapeo activo.
const availableForCreate = computed(() => {
  const mapped = new Set(accounts.value.map(a => Number(a.pasarela_id)))
  return gateways.value.filter(g => !mapped.has(Number(g.pasarela_id)))
})

// Opciones del dropdown del diálogo. Al editar (pasarela no cambiable), se muestra
// solo la pasarela de la fila; al crear, las disponibles.
const dialogGatewayOptions = computed<AvailableGateway[]>(() => {
  if (editingId.value && editingRow.value) {
    return [{
      pasarela_id: Number(editingRow.value.pasarela_id),
      pasarela_nombre: editingRow.value.pasarela_nombre || `Pasarela #${editingRow.value.pasarela_id}`
    }]
  }
  return availableForCreate.value
})

async function loadGateways() {
  if (!props.tiendaId) return
  try {
    const response = await netsuiteApi.getAvailableGateways()
    const rows = response.success && response.data ? response.data : []
    // El backend devuelve pasarela_id como string; normalizar a number para que
    // el v-model del Dropdown (number) haga match con optionValue.
    gateways.value = rows.map((g: any) => ({
      pasarela_id: Number(g.pasarela_id),
      pasarela_nombre: g.pasarela_nombre
    }))
  } catch (err: any) {
    console.error('[NetsuiteGatewayAccounts] loadGateways:', err)
    gateways.value = []
  }
}

async function loadAccounts() {
  if (!props.tiendaId) return
  isLoading.value = true
  error.value = null
  try {
    const response = await netsuiteApi.getGatewayAccounts()
    accounts.value = response.success && response.data ? response.data : []
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Error al cargar las cuentas'
    accounts.value = []
  } finally {
    isLoading.value = false
  }
}

function openCreate() {
  editingId.value = null
  editingRow.value = null
  form.value = { pasarela_id: null, netsuite_account_id: '' }
  dialogVisible.value = true
}

function openEdit(a: NetsuiteGatewayAccount) {
  editingId.value = a.id
  editingRow.value = a
  form.value = { pasarela_id: Number(a.pasarela_id), netsuite_account_id: a.netsuite_account_id }
  dialogVisible.value = true
}

function validate(): string | null {
  if (!form.value.pasarela_id) return 'Seleccione una pasarela'
  if (!form.value.netsuite_account_id.trim()) return 'Ingrese el ID de cuenta de NetSuite'
  return null
}

async function save() {
  const validationError = validate()
  if (validationError) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: validationError, life: 3000 })
    return
  }

  isSaving.value = true
  try {
    const response = editingId.value
      ? await netsuiteApi.updateGatewayAccount(editingId.value, {
          netsuite_account_id: form.value.netsuite_account_id.trim()
        })
      : await netsuiteApi.createGatewayAccount({
          pasarela_id: form.value.pasarela_id as number,
          netsuite_account_id: form.value.netsuite_account_id.trim()
        })

    if (response.success) {
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Cuenta guardada correctamente', life: 3000 })
      dialogVisible.value = false
      await loadAccounts()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudo guardar', life: 5000 })
    }
  } catch (err: any) {
    const status = err.response?.status
    const detail = status === 409
      ? 'Ya existe una cuenta para esta pasarela'
      : (err.response?.data?.message || err.message || 'Error al guardar la cuenta')
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  } finally {
    isSaving.value = false
  }
}

function confirmDelete(a: NetsuiteGatewayAccount) {
  confirm.require({
    message: `¿Desactivar la cuenta de "${a.pasarela_nombre || ('Pasarela #' + a.pasarela_id)}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, desactivar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const response = await netsuiteApi.deleteGatewayAccount(a.id)
        if (response.success) {
          toast.add({ severity: 'success', summary: 'Desactivada', detail: 'Cuenta desactivada', life: 3000 })
          accounts.value = accounts.value.filter(x => x.id !== a.id)
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: response.message || 'No se pudo desactivar', life: 4000 })
        }
      } catch (err: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error al desactivar', life: 4000 })
      }
    }
  })
}

watch(() => props.tiendaId, async (tiendaId) => {
  accounts.value = []
  gateways.value = []
  if (!tiendaId) return
  await loadGateways()
  await loadAccounts()
}, { immediate: true })
</script>

<style scoped>
:deep(.p-datatable) {
  font-size: 0.875rem;
}
:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
}
</style>
