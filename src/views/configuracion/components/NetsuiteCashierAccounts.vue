<template>
  <div>
    <Message severity="info" :closable="false" class="mb-6">
      <div class="flex items-start gap-2">
        <i class="pi pi-info-circle text-lg"></i>
        <div>
          <p class="font-semibold">Cuentas bancarias / caja</p>
          <p class="text-sm mt-1">
            Asigne el ID de la cuenta de NetSuite (banco o caja) que recibe cada método de pago.
            La resolución es en cascada: primero busca la cuenta de la <strong>caja</strong>,
            si no la encuentra usa la de la <strong>sucursal</strong>, y como último recurso
            la <strong>default de toda la tienda</strong>. Configure solo el nivel que necesite.
          </p>
        </div>
      </div>
    </Message>

    <!-- Toolbar: filtro por sucursal + nueva configuración -->
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Filtrar por sucursal</label>
        <Dropdown
          v-model="filterBranchId"
          :options="branchFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todas las sucursales"
          class="w-72"
          @change="loadAccounts"
        />
      </div>
      <Button
        label="Nueva cuenta"
        icon="pi pi-plus"
        @click="openCreate"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Empty state -->
    <Message v-else-if="accounts.length === 0" severity="warn" :closable="false">
      <p class="font-semibold">No hay cuentas configuradas{{ filterBranchId ? ' para esta sucursal' : '' }}.</p>
      <p class="text-sm mt-1">
        Cree al menos la cuenta default de la tienda para cada método de pago que use.
      </p>
    </Message>

    <!-- Tabla -->
    <DataTable
      v-else
      :value="accounts"
      stripedRows
      class="border"
    >
      <Column header="Alcance" style="min-width: 200px">
        <template #body="{ data }">
          <div class="flex items-center gap-2">
            <i :class="scopeIcon(data)" class="text-secondary-500"></i>
            <span>{{ scopeLabel(data) }}</span>
          </div>
        </template>
      </Column>

      <Column header="Método de pago" style="width: 180px">
        <template #body="{ data }">
          <Tag :value="paymentMethodLabel(data.payment_method)" :severity="paymentMethodSeverity(data.payment_method)" />
        </template>
      </Column>

      <Column header="Cuenta NetSuite" style="width: 160px">
        <template #body="{ data }">
          <span class="font-mono text-sm">{{ data.netsuite_account_id }}</span>
        </template>
      </Column>

      <Column header="Estado" style="width: 120px">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Activa' : 'Inactiva'"
            :severity="data.is_active ? 'success' : 'secondary'"
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
      :header="editingId ? 'Editar cuenta' : 'Nueva cuenta'"
      modal
      :style="{ width: '30rem' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Alcance *</label>
          <Dropdown
            v-model="form.scope"
            :options="scopeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div v-if="form.scope !== 'tienda'">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Sucursal *</label>
          <Dropdown
            v-model="form.tiendadireccion_id"
            :options="branchOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione una sucursal"
            class="w-full"
          />
        </div>

        <div v-if="form.scope === 'caja'" class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">N° de caja *</label>
            <InputNumber v-model="form.caja_numero" :min="1" :max="50" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre (opcional)</label>
            <InputText v-model="form.caja_nombre" placeholder="Ej: Caja Principal" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Método de pago *</label>
          <Dropdown
            v-model="form.payment_method"
            :options="paymentMethodOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccione un método"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">ID de cuenta NetSuite *</label>
          <InputText v-model="form.netsuite_account_id" placeholder="Ej: 10100" class="w-full font-mono" />
          <small class="text-secondary-500">El internal ID de la cuenta bancaria/caja en NetSuite.</small>
        </div>

        <div class="flex items-center gap-2">
          <InputSwitch v-model="form.is_active" />
          <span class="text-sm font-medium text-secondary-700">Configuración activa</span>
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
import type {
  NetsuiteCashierAccount,
  NetsuitePaymentMethod
} from '@/types/netsuite.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
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

type Scope = 'tienda' | 'sucursal' | 'caja'

const PAYMENT_METHODS: { value: NetsuitePaymentMethod; label: string; severity: string }[] = [
  { value: 'efectivo', label: 'Efectivo', severity: 'success' },
  { value: 'tarjeta', label: 'Tarjeta', severity: 'info' },
  { value: 'banco', label: 'Banco', severity: 'success' },
  { value: 'yape', label: 'Yape', severity: 'contrast' },
  { value: 'plin', label: 'Plin', severity: 'contrast' },
  { value: 'transferencia', label: 'Transferencia', severity: 'info' },
  { value: 'qr', label: 'QR', severity: 'warning' },
  { value: 'nota_credito', label: 'Nota de Crédito', severity: 'warning' },
  { value: 'redondeo_favor', label: 'Redondeo a Favor', severity: 'secondary' },
  { value: 'redondeo_contra', label: 'Redondeo en Contra', severity: 'danger' }
]

const scopeOptions: { value: Scope; label: string }[] = [
  { value: 'tienda', label: 'Toda la tienda (default)' },
  { value: 'sucursal', label: 'Una sucursal' },
  { value: 'caja', label: 'Una caja específica' }
]

const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)

const accounts = ref<NetsuiteCashierAccount[]>([])
const branches = ref<{ tiendadireccion_id: number; branch_name: string }[]>([])
const filterBranchId = ref<number | null>(null)

const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

const form = ref<{
  scope: Scope
  tiendadireccion_id: number | null
  caja_numero: number | null
  caja_nombre: string
  payment_method: NetsuitePaymentMethod | ''
  netsuite_account_id: string
  is_active: boolean
}>({
  scope: 'tienda',
  tiendadireccion_id: null,
  caja_numero: 1,
  caja_nombre: '',
  payment_method: '',
  netsuite_account_id: '',
  is_active: true
})

const paymentMethodOptions = PAYMENT_METHODS.map(m => ({ value: m.value, label: m.label }))
const branchOptions = computed(() =>
  branches.value.map(b => ({ value: b.tiendadireccion_id, label: b.branch_name }))
)
const branchFilterOptions = computed(() => [
  { value: null, label: 'Todas las sucursales' },
  ...branchOptions.value
])

const branchNameById = computed(() => {
  const map: Record<number, string> = {}
  branches.value.forEach(b => { map[b.tiendadireccion_id] = b.branch_name })
  return map
})

function paymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.label ?? method
}
function paymentMethodSeverity(method: string): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.severity ?? 'secondary'
}

function scopeOf(a: NetsuiteCashierAccount): Scope {
  if (!a.tiendadireccion_id) return 'tienda'
  return a.caja_numero ? 'caja' : 'sucursal'
}
function scopeIcon(a: NetsuiteCashierAccount): string {
  const s = scopeOf(a)
  return s === 'tienda' ? 'pi pi-globe' : s === 'sucursal' ? 'pi pi-building' : 'pi pi-desktop'
}
function scopeLabel(a: NetsuiteCashierAccount): string {
  if (!a.tiendadireccion_id) return 'Toda la tienda'
  const name = branchNameById.value[a.tiendadireccion_id] ?? `Sucursal #${a.tiendadireccion_id}`
  if (!a.caja_numero) return name
  const cajaLabel = a.caja_nombre ? `Caja ${a.caja_numero} (${a.caja_nombre})` : `Caja ${a.caja_numero}`
  return `${name} · ${cajaLabel}`
}

async function loadBranches() {
  if (!props.tiendaId) return
  try {
    const response = await netsuiteApi.getBranchesConfig(props.tiendaId)
    if (response.success && response.data) {
      branches.value = response.data.map((b: any) => ({
        tiendadireccion_id: b.tiendadireccion_id,
        branch_name: b.branch_name
      }))
    }
  } catch (err: any) {
    console.error('[NetsuiteCashierAccounts] loadBranches:', err)
  }
}

async function loadAccounts() {
  if (!props.tiendaId) return
  isLoading.value = true
  error.value = null
  try {
    const response = await netsuiteApi.getCashierAccounts(filterBranchId.value)
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
  form.value = {
    scope: filterBranchId.value ? 'sucursal' : 'tienda',
    tiendadireccion_id: filterBranchId.value,
    caja_numero: 1,
    caja_nombre: '',
    payment_method: '',
    netsuite_account_id: '',
    is_active: true
  }
  dialogVisible.value = true
}

function openEdit(a: NetsuiteCashierAccount) {
  editingId.value = a.id
  form.value = {
    scope: scopeOf(a),
    tiendadireccion_id: a.tiendadireccion_id,
    caja_numero: a.caja_numero ?? 1,
    caja_nombre: a.caja_nombre ?? '',
    payment_method: a.payment_method,
    netsuite_account_id: a.netsuite_account_id,
    is_active: !!a.is_active
  }
  dialogVisible.value = true
}

function validate(): string | null {
  const f = form.value
  if (f.scope !== 'tienda' && !f.tiendadireccion_id) return 'Seleccione una sucursal'
  if (f.scope === 'caja' && !f.caja_numero) return 'Ingrese el número de caja'
  if (!f.payment_method) return 'Seleccione un método de pago'
  if (!f.netsuite_account_id.trim()) return 'Ingrese el ID de cuenta de NetSuite'
  return null
}

async function save() {
  const validationError = validate()
  if (validationError) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: validationError, life: 3000 })
    return
  }

  const f = form.value
  const payload = {
    tiendadireccion_id: f.scope === 'tienda' ? null : f.tiendadireccion_id,
    caja_numero: f.scope === 'caja' ? f.caja_numero : null,
    caja_nombre: f.scope === 'caja' ? (f.caja_nombre.trim() || null) : null,
    payment_method: f.payment_method as NetsuitePaymentMethod,
    netsuite_account_id: f.netsuite_account_id.trim(),
    is_active: f.is_active ? 1 : 0
  }

  isSaving.value = true
  try {
    const response = editingId.value
      ? await netsuiteApi.updateCashierAccount(editingId.value, payload)
      : await netsuiteApi.createCashierAccount(payload)

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
      ? 'Ya existe una cuenta para este alcance y método de pago'
      : (err.response?.data?.message || err.message || 'Error al guardar la cuenta')
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 })
  } finally {
    isSaving.value = false
  }
}

function confirmDelete(a: NetsuiteCashierAccount) {
  confirm.require({
    message: `¿Desactivar la cuenta de ${paymentMethodLabel(a.payment_method)} para "${scopeLabel(a)}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, desactivar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const response = await netsuiteApi.deleteCashierAccount(a.id)
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
  branches.value = []
  filterBranchId.value = null
  if (!tiendaId) return
  await loadBranches()
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
</content>
</invoke>
