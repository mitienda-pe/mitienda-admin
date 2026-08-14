<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStoreUsersStore } from '@/stores/store-users.store'
import { useAuthStore } from '@/stores/auth.store'
import { useFormatters } from '@/composables/useFormatters'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useToast } from 'primevue/usetoast'
import type { StoreUser } from '@/types/store-users.types'
import { STORE_ROLE } from '@/types/store-users.types'

const router = useRouter()
const store = useStoreUsersStore()
const authStore = useAuthStore()
const { formatDate } = useFormatters()
const toast = useToast()

const deleteDialogVisible = ref(false)
const userToDelete = ref<StoreUser | null>(null)
const isDeleting = ref(false)

const roleDialogVisible = ref(false)
const userToPromote = ref<StoreUser | null>(null)
const isChangingRole = ref(false)

const ROLE_LABEL: Record<number, string> = {
  [STORE_ROLE.PROPIETARIO]: 'Propietario',
  [STORE_ROLE.ADMINISTRADOR]: 'Administrador',
  [STORE_ROLE.INVITADO]: 'Invitado'
}

const ROLE_SEVERITY: Record<number, string> = {
  [STORE_ROLE.PROPIETARIO]: 'success',
  [STORE_ROLE.ADMINISTRADOR]: 'warning',
  [STORE_ROLE.INVITADO]: 'info'
}

function roleLabel(user: StoreUser): string {
  return ROLE_LABEL[user.tipo_id] ?? user.tipo_nombre ?? 'Invitado'
}

function roleSeverity(user: StoreUser): string {
  return ROLE_SEVERITY[user.tipo_id] ?? 'info'
}

/**
 * Espejo de las reglas del backend (StoreUsersController::assertPuedeActuarSobre).
 * Se duplican acá solo para no ofrecer botones que van a devolver 403; la
 * autoridad sigue siendo la API.
 */
function canActOn(user: StoreUser): boolean {
  if (!store.canManageUsers) return false
  if (user.id === authStore.user?.id) return false
  if (user.tipo_id === STORE_ROLE.PROPIETARIO) return false
  if (user.tipo_id === STORE_ROLE.ADMINISTRADOR && !store.isOwner) return false
  return true
}

/** Un administrador ve todo: no hay módulos que editarle. */
function canEditModules(user: StoreUser): boolean {
  return canActOn(user) && user.tipo_id === STORE_ROLE.INVITADO
}

/** Nombrar y degradar administradores es solo del propietario. */
function canChangeRole(user: StoreUser): boolean {
  return canActOn(user) && store.isOwner
}

function confirmRoleChange(user: StoreUser) {
  userToPromote.value = user
  roleDialogVisible.value = true
}

async function handleRoleChange() {
  if (!userToPromote.value) return

  const target = userToPromote.value
  const nextRole =
    target.tipo_id === STORE_ROLE.ADMINISTRADOR ? STORE_ROLE.INVITADO : STORE_ROLE.ADMINISTRADOR

  isChangingRole.value = true
  try {
    await store.updateRole(target.id, nextRole)
    toast.add({
      severity: 'success',
      summary: 'Rol actualizado',
      detail:
        nextRole === STORE_ROLE.ADMINISTRADOR
          ? `${target.nombres} ahora es administrador de la tienda`
          : `${target.nombres} ahora es invitado. Asígnale los módulos que necesite.`,
      life: 4000
    })
    roleDialogVisible.value = false
    userToPromote.value = null
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.messages?.error || e.message || 'No se pudo cambiar el rol',
      life: 5000
    })
  } finally {
    isChangingRole.value = false
  }
}

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
        v-if="store.canManageUsers"
        label="Invitar Usuario"
        icon="pi pi-user-plus"
        @click="router.push('/store/users/invite')"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Sin permiso: no es el dueño de la tienda -->
    <div
      v-else-if="store.isForbidden"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-lock text-4xl text-gray-300 mb-3" />
      <h3 class="text-lg font-semibold text-gray-700">Acceso restringido</h3>
      <p class="text-sm text-gray-500 mt-1">
        Solo el propietario y los administradores de la tienda pueden gestionar
        los usuarios y sus permisos.
      </p>
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
        v-if="store.canManageUsers"
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
            <Tag :value="roleLabel(data)" :severity="roleSeverity(data)" />
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

        <Column
          v-if="store.canManageUsers"
          header="Acciones"
          style="min-width: 150px"
          :exportable="false"
        >
          <template #body="{ data }">
            <div v-if="canActOn(data)" class="flex gap-2">
              <Button
                v-if="canEditModules(data)"
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.top="'Editar permisos'"
                @click="router.push(`/store/users/${data.id}/edit`)"
              />
              <Button
                v-if="canChangeRole(data)"
                :icon="data.tipo_id === 3 ? 'pi pi-user-minus' : 'pi pi-user-plus'"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip.top="
                  data.tipo_id === 3 ? 'Quitar administrador' : 'Hacer administrador'
                "
                @click="confirmRoleChange(data)"
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

    <!-- Role change confirmation dialog -->
    <Dialog
      v-model:visible="roleDialogVisible"
      :header="userToPromote?.tipo_id === 3 ? 'Quitar administrador' : 'Hacer administrador'"
      :style="{ width: '480px' }"
      :modal="true"
    >
      <div v-if="userToPromote" class="flex items-start gap-4">
        <i class="pi pi-user-edit text-3xl text-primary mt-1" />
        <div v-if="userToPromote.tipo_id === 3">
          <p class="text-gray-700">
            <strong>{{ fullName(userToPromote) }}</strong> dejará de ser
            administrador y pasará a ser invitado.
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Perderá el acceso a todos los módulos y la gestión de usuarios.
            Tendrás que asignarle los módulos que necesite.
          </p>
        </div>
        <div v-else>
          <p class="text-gray-700">
            <strong>{{ fullName(userToPromote) }}</strong> pasará a ser
            administrador de la tienda.
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Tendrá acceso a todos los módulos del plan y podrá invitar y
            gestionar invitados. No podrá tocarte a ti ni a otros
            administradores.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          text
          severity="secondary"
          @click="roleDialogVisible = false"
        />
        <Button
          :label="userToPromote?.tipo_id === 3 ? 'Quitar administrador' : 'Hacer administrador'"
          icon="pi pi-check"
          :loading="isChangingRole"
          @click="handleRoleChange"
        />
      </template>
    </Dialog>
  </div>
</template>
