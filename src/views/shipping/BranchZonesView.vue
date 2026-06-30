<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Sucursal que despacha por zona</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Define qué sucursal entrega los pedidos de cada zona de reparto. La tienda online usa esto
          para mostrar disponibilidad y resolver el despacho según la dirección del comprador.
        </p>
      </div>
      <Button
        label="Asignar sucursal"
        icon="pi pi-plus"
        :disabled="store.options.zones.length === 0 || store.options.branches.length === 0"
        @click="openCreate"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <!-- Sin zonas: requisito previo -->
    <div
      v-else-if="store.options.zones.length === 0"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <i class="pi pi-map text-4xl text-secondary-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-secondary-700 mb-2">Primero crea zonas de reparto</h3>
      <p class="text-secondary-500 mb-4">
        Necesitas al menos una zona (un grupo de distritos) para poder asignarle una sucursal.
      </p>
      <Button label="Ir a Zonas de reparto" icon="pi pi-arrow-right" @click="router.push('/shipping/zones')" />
    </div>

    <!-- Sin asignaciones -->
    <div
      v-else-if="store.assignments.length === 0"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <i class="pi pi-building text-4xl text-secondary-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-secondary-700 mb-2">Sin sucursales asignadas</h3>
      <p class="text-secondary-500 mb-4">
        Asigna una sucursal despachadora a cada zona para activar el despacho por ubicación.
      </p>
      <Button label="Asignar sucursal" icon="pi pi-plus" @click="openCreate" />
    </div>

    <!-- Tabla -->
    <div v-else class="bg-white rounded-lg shadow">
      <DataTable
        :value="store.assignments"
        :paginator="store.assignments.length > 12"
        :rows="12"
        rowGroupMode="subheader"
        groupRowsBy="zoneName"
        sortField="zoneName"
        :sortOrder="1"
        stripedRows
        class="p-datatable-sm"
      >
        <template #groupheader="{ data }">
          <span class="font-semibold text-secondary">{{ data.zoneName }}</span>
        </template>

        <Column field="branchName" header="Sucursal">
          <template #body="{ data }">
            <span class="font-medium text-secondary-800">{{ data.branchName }}</span>
          </template>
        </Column>

        <Column field="priority" header="Prioridad" style="width: 120px">
          <template #body="{ data }">
            <span
              v-if="data.priority === minPriorityForZone(data.zoneId)"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
            >
              {{ data.priority }} · principal
            </span>
            <span v-else class="text-sm text-secondary-600">{{ data.priority }}</span>
          </template>
        </Column>

        <Column header="Costo / Tiempo de envío" style="width: 200px">
          <template #body="{ data }">
            <span class="text-sm text-secondary-600">
              {{ data.shippingCost !== null ? 'S/ ' + data.shippingCost.toFixed(2) : '—' }}
              <span class="text-secondary-300"> · </span>
              {{ data.shippingTime !== null ? data.shippingTime + ' día(s)' : '—' }}
            </span>
          </template>
        </Column>

        <Column field="active" header="Estado" style="width: 110px">
          <template #body="{ data }">
            <span
              :class="data.active
                ? 'bg-success/10 text-success'
                : 'bg-secondary-100 text-secondary-500'"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            >
              {{ data.active ? 'Activa' : 'Inactiva' }}
            </span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 110px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openEdit(data)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Diálogo crear / editar -->
    <Dialog
      v-model:visible="showDialog"
      :header="dialogMode === 'create' ? 'Asignar sucursal a zona' : 'Editar asignación'"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Zona de reparto</label>
          <Dropdown
            v-model="form.zoneId"
            :options="store.options.zones"
            option-label="name"
            option-value="id"
            placeholder="Selecciona una zona"
            class="w-full"
            :disabled="dialogMode === 'edit'"
          >
            <template #option="{ option }">
              {{ option.name }}
              <span class="text-xs text-secondary-400">({{ option.ubigeoCount }} distritos)</span>
            </template>
          </Dropdown>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Sucursal que despacha</label>
          <Dropdown
            v-model="form.branchId"
            :options="store.options.branches"
            option-label="name"
            option-value="id"
            placeholder="Selecciona una sucursal"
            class="w-full"
            :disabled="dialogMode === 'edit'"
          >
            <template #option="{ option }">
              {{ option.name }}
              <span v-if="option.district" class="text-xs text-secondary-400">· {{ option.district }}</span>
            </template>
          </Dropdown>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Prioridad <span class="text-secondary-400 font-normal">(menor = se usa primero si varias cubren la zona)</span>
          </label>
          <InputNumber v-model="form.priority" :min="0" :max="99" class="w-full" showButtons />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Costo envío (opcional)</label>
            <InputNumber
              v-model="form.shippingCost"
              mode="currency" currency="PEN" locale="es-PE"
              :min="0" class="w-full" placeholder="usa la cobertura"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">Tiempo (días, opcional)</label>
            <InputNumber v-model="form.shippingTime" :min="0" :max="60" class="w-full" />
          </div>
        </div>

        <div v-if="dialogMode === 'edit'" class="flex items-center gap-2">
          <InputSwitch v-model="form.active" inputId="active-switch" />
          <label for="active-switch" class="text-sm text-secondary-700">Asignación activa</label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showDialog = false" />
        <Button
          :label="dialogMode === 'create' ? 'Asignar' : 'Guardar'"
          :loading="isSaving"
          :disabled="!form.zoneId || !form.branchId"
          @click="handleSave"
        />
      </template>
    </Dialog>

    <!-- Diálogo eliminar -->
    <Dialog v-model:visible="showDeleteDialog" header="Quitar asignación" :modal="true" :style="{ width: '420px' }">
      <p>
        ¿Quitar la sucursal <strong>{{ toDelete?.branchName }}</strong> de la zona
        <strong>{{ toDelete?.zoneName }}</strong>?
      </p>
      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button label="Quitar" severity="danger" :loading="isDeleting" @click="handleDelete" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBranchZonesStore } from '@/stores/branch-zones.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { BranchZoneAssignment } from '@/types/branch-zone.types'

const router = useRouter()
const store = useBranchZonesStore()
const toast = useToast()

const showDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)
const isSaving = ref(false)

const showDeleteDialog = ref(false)
const toDelete = ref<BranchZoneAssignment | null>(null)
const isDeleting = ref(false)

const form = reactive<{
  zoneId: number | null
  branchId: number | null
  priority: number
  shippingCost: number | null
  shippingTime: number | null
  active: boolean
}>({
  zoneId: null,
  branchId: null,
  priority: 0,
  shippingCost: null,
  shippingTime: null,
  active: true,
})

// Prioridad mínima por zona (para marcar la sucursal "principal").
function minPriorityForZone(zoneId: number): number {
  const inZone = store.assignments.filter((a) => a.zoneId === zoneId)
  return inZone.length ? Math.min(...inZone.map((a) => a.priority)) : 0
}

function resetForm() {
  form.zoneId = null
  form.branchId = null
  form.priority = 0
  form.shippingCost = null
  form.shippingTime = null
  form.active = true
}

function openCreate() {
  dialogMode.value = 'create'
  editingId.value = null
  resetForm()
  showDialog.value = true
}

function openEdit(a: BranchZoneAssignment) {
  dialogMode.value = 'edit'
  editingId.value = a.id
  form.zoneId = a.zoneId
  form.branchId = a.branchId
  form.priority = a.priority
  form.shippingCost = a.shippingCost
  form.shippingTime = a.shippingTime
  form.active = a.active
  showDialog.value = true
}

async function handleSave() {
  if (!form.zoneId || !form.branchId) return
  try {
    isSaving.value = true
    if (dialogMode.value === 'create') {
      await store.create({
        zoneId: form.zoneId,
        branchId: form.branchId,
        priority: form.priority,
        shippingCost: form.shippingCost,
        shippingTime: form.shippingTime,
      })
      toast.add({ severity: 'success', summary: 'Asignada', detail: 'Sucursal asignada a la zona', life: 3000 })
    } else if (editingId.value !== null) {
      await store.update(editingId.value, {
        priority: form.priority,
        shippingCost: form.shippingCost,
        shippingTime: form.shippingTime,
        active: form.active,
      })
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Asignación actualizada', life: 3000 })
    }
    showDialog.value = false
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || err.response?.data?.messages?.error || 'No se pudo guardar',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

function confirmDelete(a: BranchZoneAssignment) {
  toDelete.value = a
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!toDelete.value) return
  try {
    isDeleting.value = true
    await store.remove(toDelete.value.id)
    toast.add({ severity: 'success', summary: 'Quitada', detail: 'Asignación eliminada', life: 3000 })
    showDeleteDialog.value = false
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.messages?.error || 'No se pudo eliminar',
      life: 5000,
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  store.fetchAll()
})
</script>
