<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStoreUsersStore } from '@/stores/store-users.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import type { UserModule } from '@/types/store-users.types'

const route = useRoute()
const router = useRouter()
const store = useStoreUsersStore()
const toast = useToast()

const userId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEditMode = computed(() => !!userId.value)

// Form fields
const email = ref('')
const nombres = ref('')
const apellidos = ref('')
const selectedModuleIds = ref<Set<number>>(new Set())
const isSaving = ref(false)
const isLoading = ref(false)

// Available modules (from plan)
const availableModules = ref<UserModule[]>([])

// Group modules by group name
const groupedModules = computed(() => {
  const groups: Record<string, UserModule[]> = {}
  for (const mod of availableModules.value) {
    const group = mod.group || 'Otros'
    if (!groups[group]) groups[group] = []
    groups[group].push(mod)
  }
  return groups
})

const allSelected = computed(() => {
  return (
    availableModules.value.length > 0 &&
    availableModules.value.every(m => selectedModuleIds.value.has(m.id))
  )
})

function toggleAll() {
  if (allSelected.value) {
    selectedModuleIds.value = new Set()
  } else {
    selectedModuleIds.value = new Set(availableModules.value.map(m => m.id))
  }
}

function toggleModule(id: number) {
  const newSet = new Set(selectedModuleIds.value)
  if (newSet.has(id)) {
    newSet.delete(id)
  } else {
    newSet.add(id)
  }
  selectedModuleIds.value = newSet
}

async function loadUserData() {
  if (!userId.value) return

  isLoading.value = true
  try {
    await store.fetchUser(userId.value)
    if (store.currentUser) {
      const { user, modules, available_modules } = store.currentUser
      email.value = user.email
      nombres.value = user.nombres
      apellidos.value = user.apellidos
      availableModules.value = available_modules
      selectedModuleIds.value = new Set(modules.map(m => m.id))
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'No se pudo cargar el usuario',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

async function loadAvailableModules() {
  isLoading.value = true
  try {
    availableModules.value = await store.fetchAvailableModules()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los módulos disponibles',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (isEditMode.value) {
    await handleUpdateModules()
  } else {
    await handleInvite()
  }
}

async function handleInvite() {
  if (!email.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Campo requerido',
      detail: 'El email es obligatorio',
      life: 3000
    })
    return
  }

  if (!nombres.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Campo requerido',
      detail: 'El nombre es obligatorio',
      life: 3000
    })
    return
  }

  isSaving.value = true
  try {
    const result = await store.inviteUser({
      email: email.value.trim(),
      nombres: nombres.value.trim(),
      apellidos: apellidos.value.trim(),
      module_ids: Array.from(selectedModuleIds.value)
    })

    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Usuario invitado',
        detail:
          result.status === 'created'
            ? 'Se creó la cuenta y se agregó a la tienda'
            : 'El usuario existente fue agregado a la tienda',
        life: 4000
      })
      router.push('/store/users')
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error al invitar',
      detail: e.response?.data?.messages?.error || e.message || 'Error desconocido',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

async function handleUpdateModules() {
  if (!userId.value) return

  isSaving.value = true
  try {
    await store.updateModules(userId.value, Array.from(selectedModuleIds.value))
    toast.add({
      severity: 'success',
      summary: 'Permisos actualizados',
      detail: 'Los módulos del usuario fueron actualizados',
      life: 3000
    })
    router.push('/store/users')
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.message || 'No se pudieron actualizar los permisos',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  if (isEditMode.value) {
    loadUserData()
  } else {
    loadAvailableModules()
  }
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Back button -->
    <router-link
      to="/store/users"
      class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      <i class="pi pi-arrow-left text-xs" />
      Volver a Usuarios
    </router-link>

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-800">
        {{ isEditMode ? 'Editar Permisos' : 'Invitar Usuario' }}
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        {{
          isEditMode
            ? 'Modifica los módulos a los que este usuario tiene acceso'
            : 'Invita a un nuevo usuario a administrar tu tienda'
        }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- User info card -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Datos del usuario</h2>

        <div v-if="isEditMode" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
            <p class="text-gray-800">{{ nombres }} {{ apellidos }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <p class="text-gray-800">{{ email }}</p>
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              Nombres <span class="text-red-500">*</span>
            </label>
            <InputText
              v-model="nombres"
              placeholder="Nombres del usuario"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
            <InputText
              v-model="apellidos"
              placeholder="Apellidos del usuario"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <!-- Modules card -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">Permisos de módulos</h2>
          <div class="flex gap-2">
            <Button
              :label="allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'"
              text
              size="small"
              :severity="allSelected ? 'secondary' : undefined"
              @click="toggleAll"
            />
          </div>
        </div>

        <p class="text-sm text-gray-500">
          Selecciona los módulos a los que el usuario tendrá acceso en esta tienda.
        </p>

        <!-- No modules available -->
        <div
          v-if="availableModules.length === 0"
          class="text-center py-8 text-gray-400"
        >
          <i class="pi pi-lock text-3xl mb-2" />
          <p>No hay módulos disponibles en el plan actual</p>
        </div>

        <!-- Module groups -->
        <div v-else class="space-y-6">
          <div v-for="(modules, groupName) in groupedModules" :key="groupName">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              {{ groupName }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <label
                v-for="mod in modules"
                :key="mod.id"
                class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                :class="
                  selectedModuleIds.has(mod.id)
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                "
              >
                <Checkbox
                  :modelValue="selectedModuleIds.has(mod.id)"
                  :binary="true"
                  @update:modelValue="toggleModule(mod.id)"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate">
                    {{ mod.name }}
                  </p>
                  <p class="text-xs text-gray-400 truncate">{{ mod.code }}</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button
          label="Cancelar"
          text
          severity="secondary"
          @click="router.push('/store/users')"
        />
        <Button
          :label="isEditMode ? 'Guardar Permisos' : 'Invitar Usuario'"
          :icon="isEditMode ? 'pi pi-check' : 'pi pi-user-plus'"
          :loading="isSaving"
          type="submit"
        />
      </div>
    </form>
  </div>
</template>
