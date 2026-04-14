<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-secondary">Mis Tiendas</h1>
        <p class="text-secondary-500 text-sm mt-1">Administra tus tiendas y crea nuevas</p>
      </div>
      <Button
        label="Crear Tienda"
        icon="pi pi-plus"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Loading -->
    <div v-if="authStore.isLoading && !authStore.stores.length" class="text-center py-12">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      <p class="text-secondary-500 mt-4">Cargando tiendas...</p>
    </div>

    <!-- Store list -->
    <div v-else class="space-y-3">
      <div
        v-for="store in sortedStores"
        :key="store.id"
        class="bg-white rounded-lg border p-4 transition-shadow hover:shadow-md"
        :class="{
          'border-primary ring-1 ring-primary/20': isCurrentStore(store),
          'opacity-60': store.status !== 'active'
        }"
      >
        <div class="flex items-center gap-4">
          <!-- Store icon -->
          <div
            class="w-14 h-14 rounded-lg flex items-center justify-center shrink-0"
            :class="store.status === 'active' ? 'bg-primary-50' : 'bg-gray-100'"
          >
            <i
              class="pi pi-shop text-2xl"
              :class="store.status === 'active' ? 'text-primary' : 'text-gray-400'"
            ></i>
          </div>

          <!-- Store info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-secondary truncate">{{ store.name }}</h3>
              <Tag
                v-if="isCurrentStore(store)"
                value="Actual"
                severity="success"
                class="text-xs"
              />
            </div>
            <p class="text-sm text-secondary-500 truncate">{{ store.url || store.slug + '.mitienda.pe' }}</p>
            <div class="flex gap-2 mt-1">
              <Tag
                :value="store.plan"
                severity="info"
                class="text-xs"
              />
              <Tag
                :value="store.status === 'active' ? 'Activa' : 'Vencida'"
                :severity="store.status === 'active' ? 'success' : 'warn'"
                class="text-xs"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="shrink-0">
            <Button
              v-if="!isCurrentStore(store) && store.status === 'active'"
              label="Ingresar"
              icon="pi pi-sign-in"
              size="small"
              outlined
              :loading="switchingStoreId === store.id"
              @click="handleSwitchStore(store)"
            />
            <span
              v-else-if="isCurrentStore(store)"
              class="text-primary text-sm font-medium"
            >
              <i class="pi pi-check-circle mr-1"></i>Conectado
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!authStore.stores.length" class="text-center py-12 bg-white rounded-lg border">
        <i class="pi pi-shop text-4xl text-secondary-300"></i>
        <p class="text-secondary-500 mt-4">No tienes tiendas creadas</p>
        <Button
          label="Crear tu primera tienda"
          icon="pi pi-plus"
          class="mt-4"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Create Store Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Crear Nueva Tienda"
      :style="{ width: '480px' }"
      modal
      :closable="!isCreating"
    >
      <div class="space-y-4">
        <!-- Store name -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Nombre de la tienda</label>
          <InputText
            v-model="createForm.nombre"
            placeholder="Mi Tienda"
            class="w-full"
            :invalid="!!errors.nombre"
            @input="errors.nombre = ''"
          />
          <small v-if="errors.nombre" class="p-error">{{ errors.nombre }}</small>
        </div>

        <!-- Subdomain -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">Subdominio</label>
          <div class="flex items-center">
            <InputText
              v-model="createForm.subdominio"
              placeholder="mi-tienda"
              class="flex-1"
              :invalid="!!errors.subdominio"
              @input="handleSubdomainInput"
            />
            <span class="text-secondary-500 text-sm ml-2 whitespace-nowrap">.mitienda.pe</span>
          </div>
          <small v-if="errors.subdominio" class="p-error">{{ errors.subdominio }}</small>
          <small v-else class="text-secondary-400">Solo letras, números y guiones (3-20 caracteres)</small>
        </div>

        <!-- Country -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1">País</label>
          <Dropdown
            v-model="createForm.pais"
            :options="countries"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <Message v-if="createError" severity="error" :closable="false" class="mt-2">
          {{ createError }}
        </Message>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          :disabled="isCreating"
          @click="showCreateDialog = false"
        />
        <Button
          label="Crear Tienda"
          icon="pi pi-plus"
          :loading="isCreating"
          @click="handleCreateStore"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import type { Store } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Switch store
const switchingStoreId = ref<number | null>(null)

const sortedStores = computed(() => {
  return [...authStore.stores].sort((a, b) => {
    // Current store first
    if (isCurrentStore(a)) return -1
    if (isCurrentStore(b)) return 1
    // Active before inactive
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return a.name.localeCompare(b.name)
  })
})

function isCurrentStore(store: Store) {
  return authStore.selectedStore?.id === store.id
}

async function handleSwitchStore(store: Store) {
  switchingStoreId.value = store.id
  const success = await authStore.selectStore(store)
  switchingStoreId.value = null

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Tienda seleccionada',
      detail: `Ahora estás trabajando en ${store.name}`,
      life: 3000
    })
    router.push('/dashboard')
  }
}

// Create store
const showCreateDialog = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createForm = ref({
  nombre: '',
  subdominio: '',
  pais: 'PE'
})
const errors = ref<Record<string, string>>({})

const countries = [
  { label: 'Perú', value: 'PE' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Colombia', value: 'CO' }
]

function handleSubdomainInput() {
  errors.value.subdominio = ''
  // Auto-clean subdomain
  createForm.value.subdominio = createForm.value.subdominio
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
}

async function handleCreateStore() {
  errors.value = {}
  createError.value = ''

  // Validate
  if (createForm.value.nombre.trim().length < 3) {
    errors.value.nombre = 'El nombre debe tener al menos 3 caracteres'
    return
  }

  const sub = createForm.value.subdominio.trim()
  if (!/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/.test(sub)) {
    errors.value.subdominio = 'Debe tener entre 3 y 20 caracteres (letras, números y guiones)'
    return
  }

  isCreating.value = true

  const result = await authStore.createStore({
    nombre: createForm.value.nombre.trim(),
    subdominio: sub,
    pais: createForm.value.pais
  })

  isCreating.value = false

  if (result) {
    showCreateDialog.value = false
    createForm.value = { nombre: '', subdominio: '', pais: 'PE' }

    toast.add({
      severity: 'success',
      summary: 'Tienda creada',
      detail: `${result.tienda_nombre_comercial} ha sido creada con un plan de prueba de 14 días`,
      life: 5000
    })
  } else {
    createError.value = authStore.error || 'Error al crear la tienda'
  }
}
</script>
