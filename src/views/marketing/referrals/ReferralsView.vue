<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Códigos de Referido</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Crea códigos para atribuir ventas a tus referidores
        </p>
      </div>
      <Button
        label="Nuevo Código"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <!-- Search -->
    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <span class="p-input-icon-left flex-1">
          <i class="pi pi-search" />
          <InputText
            v-model="searchQuery"
            placeholder="Buscar por nombre o código..."
            class="w-full"
            @keyup.enter="handleSearch"
          />
        </span>
        <Button
          label="Buscar"
          icon="pi pi-search"
          @click="handleSearch"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="referralStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="referralStore.error" severity="error" :closable="false">
      {{ referralStore.error }}
    </Message>

    <!-- Table -->
    <div v-else-if="referralStore.referralCodes.length > 0" class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable
        :value="referralStore.referralCodes"
        :paginator="referralStore.pagination.totalPages > 1"
        :rows="referralStore.pagination.perPage"
        :totalRecords="referralStore.pagination.total"
        :lazy="true"
        @page="onPageChange"
        responsiveLayout="scroll"
        stripedRows
      >
        <Column field="tiendacodigoreferido_nombre" header="Nombre" sortable>
          <template #body="{ data }">
            <span class="font-semibold">{{ data.tiendacodigoreferido_nombre }}</span>
          </template>
        </Column>

        <Column field="tiendacodigoreferido_codigo" header="Código" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                {{ data.tiendacodigoreferido_codigo }}
              </code>
              <Button
                icon="pi pi-copy"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip="'Copiar URL'"
                @click="copyReferralUrl(data.tiendacodigoreferido_codigo)"
              />
            </div>
          </template>
        </Column>

        <Column field="tiendacodigoreferido_fechacreacion" header="Fecha" sortable style="width: 150px">
          <template #body="{ data }">
            <span class="text-secondary-600 text-sm">
              {{ formatDate(data.tiendacodigoreferido_fechacreacion) }}
            </span>
          </template>
        </Column>

        <Column field="tiendacodigoreferido_activo" header="Estado" sortable style="width: 100px">
          <template #body="{ data }">
            <InputSwitch
              :modelValue="data.tiendacodigoreferido_activo === 1"
              @update:modelValue="toggleStatus(data)"
            />
          </template>
        </Column>

        <Column header="Acciones" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                size="small"
                severity="secondary"
                v-tooltip="'Editar'"
                @click="openEditDialog(data)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                size="small"
                severity="danger"
                v-tooltip="'Eliminar'"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-users text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay códigos de referido</h3>
      <p class="text-secondary-500 mb-4">
        Crea tu primer código para empezar a rastrear referidos
      </p>
      <Button
        label="Nuevo Código"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="showFormDialog"
      :header="isEditMode ? 'Editar Código' : 'Nuevo Código de Referido'"
      :modal="true"
      :style="{ width: '500px' }"
      :closable="!referralStore.isSaving"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.tiendacodigoreferido_nombre"
            class="w-full"
            :class="{ 'p-invalid': formErrors.nombre }"
            placeholder="Ej: Influencer Juan, Campaña Instagram"
          />
          <small v-if="formErrors.nombre" class="text-red-500">{{ formErrors.nombre }}</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Código <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <InputText
              v-model="formData.tiendacodigoreferido_codigo"
              class="flex-1 font-mono"
              :class="{ 'p-invalid': formErrors.codigo }"
              :disabled="isEditMode"
              placeholder="codigo123"
            />
            <Button
              v-if="!isEditMode"
              icon="pi pi-refresh"
              severity="secondary"
              v-tooltip="'Generar código'"
              :loading="isGenerating"
              @click="handleGenerateCode"
            />
          </div>
          <small v-if="formErrors.codigo" class="text-red-500">{{ formErrors.codigo }}</small>
          <small v-else-if="isEditMode" class="text-secondary-400">El código no se puede modificar</small>
        </div>

        <div class="flex items-center gap-3">
          <InputSwitch v-model="formActive" />
          <div>
            <span class="text-secondary-700 font-medium">Código activo</span>
            <p class="text-xs text-secondary-400">Solo los códigos activos se pueden usar</p>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          text
          :disabled="referralStore.isSaving"
          @click="closeFormDialog"
        />
        <Button
          :label="isEditMode ? 'Guardar Cambios' : 'Crear Código'"
          icon="pi pi-check"
          :loading="referralStore.isSaving"
          @click="saveReferralCode"
        />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar el código <strong>{{ referralCodeToDelete?.tiendacodigoreferido_nombre }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deleteReferralCode"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useReferralStore } from '@/stores/referral.store'
import { useToast } from 'primevue/usetoast'
import { useFormatters } from '@/composables/useFormatters'
import { useAuthStore } from '@/stores/auth.store'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { ReferralCode } from '@/types/referral.types'

const referralStore = useReferralStore()
const authStore = useAuthStore()
const toast = useToast()
const { formatDate } = useFormatters()

// Search
const searchQuery = ref('')

// Form dialog
const showFormDialog = ref(false)
const isEditMode = ref(false)
const editingId = ref<number | null>(null)
const isGenerating = ref(false)
const formData = ref({
  tiendacodigoreferido_nombre: '',
  tiendacodigoreferido_codigo: ''
})
const formActive = ref(true)
const formErrors = ref<Record<string, string>>({})

// Delete dialog
const showDeleteDialog = ref(false)
const referralCodeToDelete = ref<ReferralCode | null>(null)
const isDeleting = ref(false)

// Computed storefront URL
const storefrontUrl = computed(() => {
  const store = authStore.selectedStore
  if (store?.url) {
    return store.url.startsWith('http') ? store.url : `https://${store.url}`
  }
  if (store?.slug) {
    return `https://${store.slug}.mitienda.pe`
  }
  return 'https://tutienda.mitienda.pe'
})

// Methods
const handleSearch = () => {
  referralStore.fetchReferralCodes({ search: searchQuery.value, page: 1 })
}

const onPageChange = (event: { page: number }) => {
  referralStore.fetchReferralCodes({ search: searchQuery.value, page: event.page + 1 })
}

const openCreateDialog = async () => {
  isEditMode.value = false
  editingId.value = null
  formData.value = {
    tiendacodigoreferido_nombre: '',
    tiendacodigoreferido_codigo: ''
  }
  formActive.value = true
  formErrors.value = {}
  showFormDialog.value = true

  // Auto-generate code
  await handleGenerateCode()
}

const openEditDialog = (referralCode: ReferralCode) => {
  isEditMode.value = true
  editingId.value = referralCode.tiendacodigoreferido_id
  formData.value = {
    tiendacodigoreferido_nombre: referralCode.tiendacodigoreferido_nombre,
    tiendacodigoreferido_codigo: referralCode.tiendacodigoreferido_codigo
  }
  formActive.value = referralCode.tiendacodigoreferido_activo === 1
  formErrors.value = {}
  showFormDialog.value = true
}

const closeFormDialog = () => {
  showFormDialog.value = false
}

const handleGenerateCode = async () => {
  isGenerating.value = true
  try {
    formData.value.tiendacodigoreferido_codigo = await referralStore.generateCode(10)
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo generar el código',
      life: 3000
    })
  } finally {
    isGenerating.value = false
  }
}

const validateForm = (): boolean => {
  formErrors.value = {}

  if (!formData.value.tiendacodigoreferido_nombre || formData.value.tiendacodigoreferido_nombre.trim().length < 2) {
    formErrors.value.nombre = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  if (!isEditMode.value) {
    if (!formData.value.tiendacodigoreferido_codigo || formData.value.tiendacodigoreferido_codigo.trim().length < 3) {
      formErrors.value.codigo = 'El código es requerido (mínimo 3 caracteres)'
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.value.tiendacodigoreferido_codigo)) {
      formErrors.value.codigo = 'El código solo puede contener letras y números'
    }
  }

  return Object.keys(formErrors.value).length === 0
}

const saveReferralCode = async () => {
  if (!validateForm()) {
    return
  }

  try {
    if (isEditMode.value && editingId.value) {
      await referralStore.updateReferralCode(editingId.value, {
        tiendacodigoreferido_nombre: formData.value.tiendacodigoreferido_nombre,
        tiendacodigoreferido_activo: formActive.value ? 1 : 0
      })
      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'Código actualizado correctamente',
        life: 3000
      })
    } else {
      await referralStore.createReferralCode({
        tiendacodigoreferido_nombre: formData.value.tiendacodigoreferido_nombre,
        tiendacodigoreferido_codigo: formData.value.tiendacodigoreferido_codigo.toLowerCase(),
        tiendacodigoreferido_activo: formActive.value ? 1 : 0
      })
      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Código creado correctamente',
        life: 3000
      })
    }
    closeFormDialog()
  } catch (error: any) {
    const errorMessage = error.response?.data?.messages
      ? Object.values(error.response.data.messages).join(', ')
      : error.response?.data?.message || 'Error al guardar'
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  }
}

const toggleStatus = async (referralCode: ReferralCode) => {
  try {
    const updated = await referralStore.toggleReferralCode(referralCode.tiendacodigoreferido_id)
    toast.add({
      severity: 'success',
      summary: updated.tiendacodigoreferido_activo === 1 ? 'Activado' : 'Desactivado',
      detail: `Código ${updated.tiendacodigoreferido_activo === 1 ? 'activado' : 'desactivado'} correctamente`,
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cambiar el estado',
      life: 3000
    })
  }
}

const confirmDelete = (referralCode: ReferralCode) => {
  referralCodeToDelete.value = referralCode
  showDeleteDialog.value = true
}

const deleteReferralCode = async () => {
  if (!referralCodeToDelete.value) return

  isDeleting.value = true
  try {
    await referralStore.deleteReferralCode(referralCodeToDelete.value.tiendacodigoreferido_id)
    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'Código eliminado correctamente',
      life: 3000
    })
    showDeleteDialog.value = false
    referralCodeToDelete.value = null
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el código',
      life: 3000
    })
  } finally {
    isDeleting.value = false
  }
}

const copyReferralUrl = async (code: string) => {
  const url = `${storefrontUrl.value}?ref=${code}`
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'URL copiada al portapapeles',
      life: 2000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo copiar al portapapeles',
      life: 3000
    })
  }
}

onMounted(() => {
  referralStore.fetchReferralCodes()
})
</script>
