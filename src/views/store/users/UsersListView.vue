<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStoreUsersStore } from '@/stores/store-users.store'
import { useFormatters } from '@/composables/useFormatters'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import type { StoreUser } from '@/types/store-users.types'

const router = useRouter()
const store = useStoreUsersStore()
const { formatDate } = useFormatters()
const toast = useToast()

const deleteDialogVisible = ref(false)
const userToDelete = ref<StoreUser | null>(null)
const isDeleting = ref(false)

onMounted(() => {
  store.fetchUsers()
})

function confirmDelete(user: StoreUser) {
  userToDelete.value = user
  deleteDialogVisible.value = true
}

async function handleDelete() {
  if (!userToDelete.value) return

  isDeleting.value = true
  try {
    await store.deleteUser(userToDelete.value.id)
    toast.add({
      severity: 'success',
      summary: 'Usuario eliminado',
      detail: `${userToDelete.value.nombres} fue eliminado de la tienda`,
      life: 3000
    })
    deleteDialogVisible.value = false
    userToDelete.value = null
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'No se pudo eliminar al usuario',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

function fullName(user: StoreUser): string {
  return `${user.nombres} ${user.apellidos}`.trim()
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Usuarios</h1>
        <p class="text-sm text-gray-500 mt-1">
          Administra los usuarios que tienen acceso a tu tienda
        </p>
      </div>
      <Button
        v-if="store.isOwner"
        label="Invitar Usuario"
        icon="pi pi-user-plus"
        @click="router.push('/store/users/invite')"
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
        @click="store.fetchUsers()"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!store.users.length"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-users text-4xl text-gray-300 mb-3" />
      <h3 class="text-lg font-semibold text-gray-700">Sin usuarios</h3>
      <p class="text-sm text-gray-500 mt-1">
        Invita a otros usuarios para que administren tu tienda
      </p>
      <Button
        v-if="store.isOwner"
        label="Invitar Usuario"
        icon="pi pi-user-plus"
        class="mt-4"
        @click="router.push('/store/users/invite')"
      />
    </div>

    <!-- Users table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable
        :value="store.users"
        :rows="50"
        stripedRows
        class="p-datatable-sm"
      >
        <Column header="Nombre" style="min-width: 200px">
          <template #body="{ data }">
            <div>
              <p class="font-medium text-gray-800">{{ fullName(data) }}</p>
              <p class="text-xs text-gray-400">{{ data.email }}</p>
            </div>
          </template>
        </Column>

        <Column header="Tipo" style="min-width: 140px">
          <template #body="{ data }">
            <Tag
              :value="data.tipo_id === 1 ? 'Administrador' : 'Invitado'"
              :severity="data.tipo_id === 1 ? 'success' : 'info'"
            />
          </template>
        </Column>

        <Column field="telefono" header="Teléfono" style="min-width: 120px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">
              {{ data.telefono || '—' }}
            </span>
          </template>
        </Column>

        <Column header="Último ingreso" style="min-width: 140px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">
              {{ data.fecha_ultimo_ingreso ? formatDate(data.fecha_ultimo_ingreso) : 'Nunca' }}
            </span>
          </template>
        </Column>

        <Column header="Fecha registro" style="min-width: 140px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">
              {{ formatDate(data.fecha_creacion) }}
            </span>
          </template>
        </Column>

        <Column v-if="store.isOwner" header="Acciones" style="min-width: 120px" :exportable="false">
          <template #body="{ data }">
            <div v-if="data.tipo_id === 2" class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.top="'Editar permisos'"
                @click="router.push(`/store/users/${data.id}/edit`)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                v-tooltip.top="'Eliminar'"
                @click="confirmDelete(data)"
              />
            </div>
            <span v-else class="text-xs text-gray-400">—</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Delete confirmation dialog -->
    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Eliminar usuario"
      :style="{ width: '450px' }"
      :modal="true"
    >
      <div class="flex items-start gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-amber-500 mt-1" />
        <div>
          <p class="text-gray-700">
            ¿Deseas eliminar a
            <strong>{{ userToDelete ? fullName(userToDelete) : '' }}</strong>
            de tu tienda?
          </p>
          <p class="text-sm text-gray-500 mt-2">
            El usuario perderá acceso a esta tienda. Su cuenta seguirá existiendo.
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
          label="Eliminar"
          severity="danger"
          icon="pi pi-trash"
          :loading="isDeleting"
          @click="handleDelete"
        />
      </template>
    </Dialog>
  </div>
</template>
