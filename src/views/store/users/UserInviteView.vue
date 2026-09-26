<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStoreUsersStore } from '@/stores/store-users.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import RadioButton from 'primevue/radiobutton'
import type { ModuleLevel, StoreBranch, UserModule } from '@/types/store-users.types'
import { MODULE_LEVEL, STORE_ROLE } from '@/types/store-users.types'

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
/**
 * Nivel por módulo concedido. Lo que no esté acá va en EDICION, igual que el
 * default de la columna: marcar un módulo nunca lo deja en solo lectura sin que
 * alguien lo haya elegido.
 */
const moduleLevels = ref<Record<number, ModuleLevel>>({})
/**
 * Alcance por sucursal. **Set vacío = todas**, que es el default de la
 * plataforma y lo que ve una tienda de un solo local. No es "ninguna".
 */
const selectedBranchIds = ref<Set<number>>(new Set())
const availableBranches = ref<StoreBranch[]>([])

/**
 * La tarjeta solo aparece con 2 o más sucursales: con una sola, acotar no
 * significa nada y el comerciante se preguntaría para qué está.
 */
const showBranchScope = computed(() => availableBranches.value.length > 1)
const branchScopeIsOpen = computed(() => selectedBranchIds.value.size === 0)

function toggleBranch(id: number) {
  const next = new Set(selectedBranchIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedBranchIds.value = next
}

function clearBranchScope() {
  selectedBranchIds.value = new Set()
}
/**
 * Rol con el que se invita. Un administrador ve todos los módulos del plan y no
 * usa `usuariosmodulos`, así que al elegirlo la lista de permisos deja de
 * aplicar y se esconde.
 */
const tipoId = ref<number>(STORE_ROLE.INVITADO)
const invitaComoAdministrador = computed(() => tipoId.value === STORE_ROLE.ADMINISTRADOR)
const isSaving = ref(false)
const isLoading = ref(false)

// Available modules (from plan)
const availableModules = ref<UserModule[]>([])

/**
 * Agrupa los módulos respetando el orden en que los manda la API, que ya viene
 * con la taxonomía del menú del backoffice (Config\BackofficeModules).
 *
 * La clave de agrupación se normaliza (minúsculas, sin tildes) a propósito: la
 * columna `modulos.modulo_grupo` es la del panel legacy y trae el mismo grupo
 * escrito de varias formas — `Catálogo` y `catalogo`, `Ventas` y `ventas` —, lo
 * que hacía aparecer dos veces el mismo encabezado. Hoy la API normaliza antes
 * de responder, pero agrupar por texto crudo dejaría el bug a un `git revert`
 * de distancia.
 */
const groupedModules = computed(() => {
  const groups: { key: string; name: string; modules: UserModule[] }[] = []
  const byKey = new Map<string, (typeof groups)[number]>()

  for (const mod of availableModules.value) {
    const name = mod.group || 'Otros'
    const key = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

    let group = byKey.get(key)
    if (!group) {
      group = { key, name, modules: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.modules.push(mod)
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

function levelOf(id: number): ModuleLevel {
  return moduleLevels.value[id] ?? MODULE_LEVEL.EDICION
}

function setLevel(id: number, level: ModuleLevel) {
  moduleLevels.value = { ...moduleLevels.value, [id]: level }
}

/**
 * Deja TODOS los módulos marcados en un nivel.
 *
 * Sin esto, dejar a alguien en solo lectura es clic por clic sobre cuarenta y
 * pico de módulos, que es justo el caso más común ("quiero un usuario que solo
 * mire"). Solo toca lo seleccionado: un módulo no concedido no tiene nivel.
 */
function setAllLevels(level: ModuleLevel) {
  const next: Record<number, ModuleLevel> = { ...moduleLevels.value }
  for (const id of selectedModuleIds.value) {
    next[id] = level
  }
  moduleLevels.value = next
}

/** Cuántos de los módulos marcados están en solo lectura. */
const readOnlyCount = computed(
  () => Array.from(selectedModuleIds.value).filter(id => levelOf(id) === MODULE_LEVEL.LECTURA).length
)

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
      moduleLevels.value = Object.fromEntries(
        modules.map(m => [m.id, m.level ?? MODULE_LEVEL.EDICION])
      )
      availableBranches.value = store.currentUser.available_branches ?? []
      selectedBranchIds.value = new Set(
        (store.currentUser.branches ?? []).map(b => b.id)
      )
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
    availableBranches.value = await store.fetchStoreBranches()
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
      // Un administrador no lleva módulos: los tiene todos por definición.
      module_ids: invitaComoAdministrador.value ? [] : Array.from(selectedModuleIds.value),
      module_levels: invitaComoAdministrador.value ? {} : moduleLevels.value,
      // Un administrador no se acota: tiene acceso total por definición.
      branch_ids: invitaComoAdministrador.value ? [] : Array.from(selectedBranchIds.value),
      tipo_id: tipoId.value
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
    await store.updateModules(
      userId.value,
      Array.from(selectedModuleIds.value),
      moduleLevels.value
    )
    if (showBranchScope.value) {
      await store.updateBranches(userId.value, Array.from(selectedBranchIds.value))
    }
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
    // `isOwner` sale del listado, y a esta vista se puede llegar por URL sin
    // haber pasado por él. Sin esto el propietario no vería el selector de rol.
    if (!store.users.length) store.fetchUsers()
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

      <!-- Role card: solo al invitar, y solo el propietario puede nombrar admins -->
      <div
        v-if="!isEditMode && store.isOwner"
        class="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <h2 class="text-lg font-semibold text-gray-800">Rol en la tienda</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
            :class="
              tipoId === STORE_ROLE.INVITADO
                ? 'border-primary/30 bg-primary/5'
                : 'border-gray-200 hover:bg-gray-50'
            "
          >
            <RadioButton v-model="tipoId" :value="STORE_ROLE.INVITADO" />
            <span>
              <span class="block font-medium text-gray-800">Invitado</span>
              <span class="block text-sm text-gray-500 mt-1">
                Solo accede a los módulos que le marques.
              </span>
            </span>
          </label>
          <label
            class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
            :class="
              tipoId === STORE_ROLE.ADMINISTRADOR
                ? 'border-primary/30 bg-primary/5'
                : 'border-gray-200 hover:bg-gray-50'
            "
          >
            <RadioButton v-model="tipoId" :value="STORE_ROLE.ADMINISTRADOR" />
            <span>
              <span class="block font-medium text-gray-800">Administrador</span>
              <span class="block text-sm text-gray-500 mt-1">
                Accede a todo y gestiona invitados. No puede tocar al
                propietario ni a otros administradores.
              </span>
            </span>
          </label>
        </div>
      </div>

      <!-- Alcance por sucursal: solo con 2 o más locales -->
      <div
        v-if="showBranchScope && !invitaComoAdministrador"
        class="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-800">Sucursales</h2>
          <Button
            v-if="!branchScopeIsOpen"
            label="Quitar restricción"
            text
            size="small"
            severity="secondary"
            @click="clearBranchScope"
          />
        </div>

        <p class="text-sm text-gray-500">
          Si no marcas ninguna, el usuario puede operar en
          <strong>todas las sucursales</strong>. Al marcar una o más, solo podrá
          ver y mover el stock e inventario de esas.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <label
            v-for="branch in availableBranches"
            :key="branch.id"
            class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
            :class="
              selectedBranchIds.has(branch.id)
                ? 'border-primary/30 bg-primary/5'
                : 'border-gray-200 hover:bg-gray-50'
            "
          >
            <Checkbox
              :modelValue="selectedBranchIds.has(branch.id)"
              :binary="true"
              @update:modelValue="toggleBranch(branch.id)"
            />
            <span class="text-sm font-medium text-gray-700 truncate">
              {{ branch.name || `Sucursal ${branch.id}` }}
            </span>
          </label>
        </div>

        <p
          v-if="branchScopeIsOpen"
          class="text-sm text-gray-400 flex items-center gap-2"
        >
          <i class="pi pi-globe text-xs" />
          Sin restricción: todas las sucursales
        </p>
      </div>

      <!-- Modules card -->
      <div
        v-if="!invitaComoAdministrador"
        class="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
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
          Selecciona los módulos a los que el usuario tendrá acceso y con qué
          nivel: <strong>Ver</strong> deja consultar la pantalla sin poder
          modificar nada, <strong>Editar</strong> es el acceso completo.
        </p>

        <!-- Nivel en bloque: el caso común es "que solo mire" -->
        <div
          v-if="selectedModuleIds.size > 0"
          class="flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 px-3 py-2"
        >
          <span class="text-sm text-gray-600">
            Aplicar a los {{ selectedModuleIds.size }} módulos marcados:
          </span>
          <div class="flex gap-2">
            <Button
              label="Solo ver"
              text
              size="small"
              severity="secondary"
              @click="setAllLevels(MODULE_LEVEL.LECTURA)"
            />
            <Button
              label="Permitir editar"
              text
              size="small"
              severity="secondary"
              @click="setAllLevels(MODULE_LEVEL.EDICION)"
            />
          </div>
          <span v-if="readOnlyCount > 0" class="text-sm text-amber-700">
            <i class="pi pi-eye text-xs" />
            {{ readOnlyCount }} en solo lectura
          </span>
        </div>

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
          <div v-for="group in groupedModules" :key="group.key">
            <h3 class="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              {{ group.name }}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <div
                v-for="mod in group.modules"
                :key="mod.id"
                class="flex items-center gap-3 p-3 rounded-lg border transition-colors"
                :class="
                  selectedModuleIds.has(mod.id)
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-gray-200 hover:bg-gray-50'
                "
              >
                <!--
                  El <label> abarca solo la casilla y el nombre: si envolviera
                  también el selector de nivel, cada clic en "Ver" o "Editar"
                  desmarcaría el módulo.
                -->
                <label class="flex flex-1 min-w-0 items-center gap-3 cursor-pointer">
                  <Checkbox
                    :modelValue="selectedModuleIds.has(mod.id)"
                    :binary="true"
                    @update:modelValue="toggleModule(mod.id)"
                  />
                  <span class="flex-1 min-w-0">
                    <span class="block text-sm font-medium text-gray-700 truncate">
                      {{ mod.name }}
                    </span>
                    <span class="block text-xs text-gray-400 truncate">{{ mod.code }}</span>
                  </span>
                </label>

                <div
                  v-if="selectedModuleIds.has(mod.id)"
                  class="flex shrink-0 overflow-hidden rounded-md border border-gray-200 bg-white text-xs"
                >
                  <button
                    type="button"
                    class="px-2 py-1 transition-colors"
                    :class="
                      levelOf(mod.id) === MODULE_LEVEL.LECTURA
                        ? 'bg-amber-100 font-medium text-amber-800'
                        : 'text-gray-500 hover:bg-gray-50'
                    "
                    @click="setLevel(mod.id, MODULE_LEVEL.LECTURA)"
                  >
                    Ver
                  </button>
                  <button
                    type="button"
                    class="px-2 py-1 border-l border-gray-200 transition-colors"
                    :class="
                      levelOf(mod.id) === MODULE_LEVEL.EDICION
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-gray-500 hover:bg-gray-50'
                    "
                    @click="setLevel(mod.id, MODULE_LEVEL.EDICION)"
                  >
                    Editar
                  </button>
                </div>
              </div>
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
