<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/pos.store'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import type { PosCajero, PosCajeroRol } from '@/types/pos.types'

const router = useRouter()
const store = usePosStore()
const toast = useToast()

const deleteDialogVisible = ref(false)
const cajeroToDelete = ref<PosCajero | null>(null)
const isDeleting = ref(false)

onMounted(() => {
  store.fetchCajeros()
})

function fullName(c: PosCajero): string {
  return `${c.empleado_nombres ?? ''} ${c.empleado_apellidos ?? ''}`.trim()
}

function rolLabel(rol: PosCajeroRol): string {
  if (rol === 'administrador') return 'Administrador'
  if (rol === 'supervisor') return 'Supervisor'
  return 'Cajero'
}

function rolSeverity(rol: PosCajeroRol): 'success' | 'info' | 'warning' {
  if (rol === 'administrador') return 'success'
  if (rol === 'supervisor') return 'warning'
  return 'info'
}

function sucursalesLabel(c: PosCajero): string {
  if (!c.sucursales || c.sucursales.length === 0) return '—'
  return c.sucursales.map(s => s.tiendadireccion_nombresucursal).join(', ')
}

function horarioLabel(c: PosCajero): string {
  if (!c.empleado_horario_inicio && !c.empleado_horario_fin) return 'Sin horario'
  const start = (c.empleado_horario_inicio ?? '').slice(0, 5)
  const end = (c.empleado_horario_fin ?? '').slice(0, 5)
  return `${start || '—'} – ${end || '—'}`
}

function confirmDelete(c: PosCajero) {
  cajeroToDelete.value = c
  deleteDialogVisible.value = true
}

async function handleDelete() {
  if (!cajeroToDelete.value) return
  isDeleting.value = true
  try {
    const ok = await store.deleteCajero(cajeroToDelete.value.empleado_id)
    if (ok) {
      toast.add({
        severity: 'success',
        summary: 'Cajero desactivado',
        detail: `${fullName(cajeroToDelete.value)} fue desactivado`,
        life: 3000
      })
      deleteDialogVisible.value = false
      cajeroToDelete.value = null
    } else {
      throw new Error(store.error ?? 'No se pudo desactivar')
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e?.message || 'No se pudo desactivar al cajero',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Cajeros POS</h1>
        <p class="text-sm text-gray-500 mt-1">
          Administra los empleados que pueden iniciar sesión en el POS con un PIN
        </p>
      </div>
      <Button
        label="Nuevo cajero"
        icon="pi pi-user-plus"
        @click="router.push('/pos/cajeros/nuevo')"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error"
      class="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2" />
      <p class="text-red-700 font-medium">{{ store.error }}</p>
      <Button
        label="Reintentar"
        icon="pi pi-refresh"
        class="mt-4"
        severity="danger"
        outlined
        @click="store.fetchCajeros()"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!store.cajeros.length"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-id-card text-4xl text-gray-300 mb-3" />
      <h3 class="text-lg font-semibold text-gray-700">Sin cajeros</h3>
      <p class="text-sm text-gray-500 mt-1">
        Crea el primer cajero para que pueda iniciar sesión en el POS
      </p>
      <Button
        label="Nuevo cajero"
        icon="pi pi-user-plus"
        class="mt-4"
        @click="router.push('/pos/cajeros/nuevo')"
      />
    </div>

    <!-- Cajeros table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable :value="store.cajeros" :rows="50" stripedRows class="p-datatable-sm">
        <Column header="Nombre" style="min-width: 220px">
          <template #body="{ data }">
            <div>
              <p class="font-medium text-gray-800">{{ fullName(data) }}</p>
              <p v-if="data.empleado_email" class="text-xs text-gray-400">
                {{ data.empleado_email }}
              </p>
            </div>
          </template>
        </Column>

        <Column field="empleado_documento" header="Documento" style="min-width: 120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.empleado_documento || '—' }}</span>
          </template>
        </Column>

        <Column header="PIN" style="min-width: 80px">
          <template #body>
            <span class="text-sm text-gray-500 tracking-widest">••••</span>
          </template>
        </Column>

        <Column header="Rol" style="min-width: 140px">
          <template #body="{ data }">
            <Tag :value="rolLabel(data.empleado_rol)" :severity="rolSeverity(data.empleado_rol)" />
          </template>
        </Column>

        <Column header="Horario" style="min-width: 140px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ horarioLabel(data) }}</span>
          </template>
        </Column>

        <Column header="Sucursales" style="min-width: 200px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ sucursalesLabel(data) }}</span>
          </template>
        </Column>

        <Column header="NetSuite ID" style="min-width: 140px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.empleado_netsuite_id || '—' }}</span>
          </template>
        </Column>

        <Column header="Estado" style="min-width: 110px">
          <template #body="{ data }">
            <Tag
              :value="data.empleado_activo ? 'Activo' : 'Inactivo'"
              :severity="data.empleado_activo ? 'success' : 'secondary'"
            />
          </template>
        </Column>

        <Column header="Acciones" style="min-width: 120px" :exportable="false">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.top="'Editar'"
                @click="router.push(`/pos/cajeros/${data.empleado_id}`)"
              />
              <Button
                v-if="data.empleado_activo"
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                v-tooltip.top="'Desactivar'"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete confirmation dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Desactivar cajero"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="flex items-start gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-amber-500 mt-1" />
        <div>
          <p class="text-gray-700">
            ¿Deseas desactivar a
            <strong>{{ cajeroToDelete ? fullName(cajeroToDelete) : '' }}</strong>?
          </p>
          <p class="text-sm text-gray-500 mt-2">
            El cajero ya no podrá iniciar sesión en el POS. Sus registros históricos se conservan.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          text
          severity="secondary"
          @click="deleteDialogVisible = false"
        />
        <Button
          label="Desactivar"
          severity="danger"
          icon="pi pi-trash"
          :loading="isDeleting"
          @click="handleDelete"
        />
      </template>
    </Dialog>
  </div>
</template>
