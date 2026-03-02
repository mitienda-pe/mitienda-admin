<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Bloques de Componentes</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ componentsStore.pagination.total }} componentes registrados
        </p>
      </div>
      <Button
        label="Crear bloque"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <!-- Loading -->
    <div v-if="componentsStore.isLoading && !componentsStore.components.length" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="componentsStore.error" severity="error" :closable="false">
      {{ componentsStore.error }}
    </Message>

    <!-- Empty State -->
    <div
      v-else-if="!componentsStore.components.length"
      class="bg-white rounded-lg shadow p-12 text-center"
    >
      <i class="pi pi-box text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay componentes</h3>
      <p class="text-secondary-500 mb-6">Crea tu primer bloque de componente HTML.</p>
      <Button label="Crear bloque" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- DataTable -->
    <div v-else class="bg-white rounded-lg shadow">
      <DataTable
        :value="componentsStore.components"
        :lazy="true"
        :paginator="true"
        :rows="rows"
        :totalRecords="componentsStore.pagination.total"
        :loading="componentsStore.isLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage"
        @sort="onSort"
        removableSort
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="name" header="Nombre" :sortable="true" sortField="tiendacomponente_nombre">
          <template #body="{ data }">
            <span class="font-medium text-secondary">{{ data.name }}</span>
          </template>
        </Column>

        <Column field="code" header="Código" :sortable="true" sortField="tiendacomponente_codigo">
          <template #body="{ data }">
            <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ data.code }}</code>
          </template>
        </Column>

        <Column field="editor_type" header="Editor">
          <template #body="{ data }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="editorBadgeClass(data.editor_type)"
            >
              <i :class="editorIcon(data.editor_type)" class="mr-1 text-xs"></i>
              {{ editorLabel(data.editor_type) }}
            </span>
          </template>
        </Column>

        <Column
          field="active"
          header="Activo"
          :sortable="true"
          sortField="tiendacomponente_swactivo"
          style="width: 100px"
        >
          <template #body="{ data }">
            <InputSwitch
              :modelValue="data.active"
              @update:modelValue="handleToggleActive(data)"
            />
          </template>
        </Column>

        <Column
          field="created_at"
          header="Fecha"
          :sortable="true"
          sortField="tiendacomponente_fecharegistro"
          style="width: 150px"
        >
          <template #body="{ data }">
            <span class="text-sm text-secondary-500">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 100px">
          <template #body="{ data }">
            <Button
              v-if="data.type_id === 2"
              v-tooltip.top="'Editar'"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              @click="$router.push({ name: 'component-edit', params: { id: data.id } })"
            />
            <span v-else class="text-xs text-secondary-400 italic">Solo lectura</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create Dialog -->
    <Dialog
      v-model:visible="showCreateDialog"
      header="Nuevo bloque"
      modal
      :style="{ width: '640px' }"
      :closable="!isCreating"
    >
      <form @submit.prevent="handleCreate">
        <!-- Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre *</label>
          <InputText
            v-model="form.name"
            class="w-full"
            placeholder="Nombre del bloque"
            :class="{ 'p-invalid': formErrors.name }"
            @input="autoGenerateCode"
          />
          <small v-if="formErrors.name" class="p-error">{{ formErrors.name }}</small>
        </div>

        <!-- Code -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Código</label>
          <InputText
            v-model="form.code"
            class="w-full"
            placeholder="codigo_del_bloque (se genera automáticamente)"
          />
          <small class="text-secondary-400">Identificador único para usar en plantillas. Se genera automáticamente.</small>
        </div>

        <Divider />

        <!-- Editor Type -->
        <div class="mb-2">
          <h3 class="text-base font-semibold text-secondary mb-1">Tipo de editor</h3>
          <p class="text-sm text-secondary-500 mb-4">
            El bloque solo podrá editarse con el editor que elijas ahora.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- WYSIWYG -->
            <div
              class="border-2 rounded-lg p-4 cursor-pointer transition-all"
              :class="form.editor_type === 'wysiwyg'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'wysiwyg'"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center"
                  :class="form.editor_type === 'wysiwyg' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i class="pi pi-align-left"></i>
                </div>
                <h4 class="font-semibold text-secondary text-sm">Editor Visual</h4>
              </div>
              <p class="text-xs text-secondary-500">Edita como en un procesador de textos.</p>
            </div>

            <!-- Code -->
            <div
              class="border-2 rounded-lg p-4 cursor-pointer transition-all"
              :class="form.editor_type === 'code'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'code'"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center"
                  :class="form.editor_type === 'code' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i class="pi pi-code"></i>
                </div>
                <h4 class="font-semibold text-secondary text-sm">Editor de Código</h4>
              </div>
              <p class="text-xs text-secondary-500">Escribe HTML con resaltado de sintaxis.</p>
            </div>

            <!-- Visual Builder -->
            <div
              class="border-2 rounded-lg p-4 cursor-pointer transition-all"
              :class="form.editor_type === 'visual_builder'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'visual_builder'"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-9 h-9 rounded-lg flex items-center justify-center"
                  :class="form.editor_type === 'visual_builder' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i class="pi pi-th-large"></i>
                </div>
                <h4 class="font-semibold text-secondary text-sm">Visual Builder</h4>
              </div>
              <p class="text-xs text-secondary-500">Arrastra y suelta bloques visualmente.</p>
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" :disabled="isCreating" @click="showCreateDialog = false" />
        <Button
          label="Crear y editar"
          icon="pi pi-arrow-right"
          iconPos="right"
          :loading="isCreating"
          @click="handleCreate"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useComponentsStore } from '@/stores/components.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import type { DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import type { StoreComponent, ComponentEditorType } from '@/types/component.types'

const router = useRouter()
const componentsStore = useComponentsStore()
const { formatDate } = useFormatters()
const toast = useToast()

const rows = ref(20)
const sortField = ref('tiendacomponente_fecharegistro')
const sortOrder = ref('DESC')

// Create dialog state
const showCreateDialog = ref(false)
const isCreating = ref(false)
const form = reactive({
  name: '',
  code: '',
  editor_type: 'wysiwyg' as ComponentEditorType,
})
const formErrors = reactive<Record<string, string>>({})

const openCreateDialog = () => {
  form.name = ''
  form.code = ''
  form.editor_type = 'wysiwyg'
  Object.keys(formErrors).forEach(k => delete formErrors[k])
  showCreateDialog.value = true
}

const autoGenerateCode = () => {
  let code = form.name.toLowerCase()
  // Transliterate common accented chars
  code = code
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n')
  code = code.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  form.code = code || ''
}

const handleCreate = async () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k])

  if (!form.name.trim()) {
    formErrors.name = 'El nombre es obligatorio'
    return
  }

  try {
    isCreating.value = true
    const component = await componentsStore.createComponent({
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      editor_type: form.editor_type,
    })
    showCreateDialog.value = false
    toast.add({
      severity: 'success',
      summary: 'Creado',
      detail: 'Bloque creado exitosamente',
      life: 3000,
    })
    router.push({ name: 'component-edit', params: { id: component.id } })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || error.message || 'Error al crear el bloque',
      life: 5000,
    })
  } finally {
    isCreating.value = false
  }
}

// Editor type helpers
const editorIcon = (type: ComponentEditorType) => {
  if (type === 'wysiwyg') return 'pi pi-align-left'
  if (type === 'visual_builder') return 'pi pi-th-large'
  return 'pi pi-code'
}

const editorLabel = (type: ComponentEditorType) => {
  if (type === 'wysiwyg') return 'Visual'
  if (type === 'visual_builder') return 'Builder'
  return 'Código'
}

const editorBadgeClass = (type: ComponentEditorType) => {
  if (type === 'wysiwyg') return 'bg-blue-100 text-blue-800'
  if (type === 'visual_builder') return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-700'
}

const loadData = (page = 1) => {
  componentsStore.fetchComponents({
    page,
    limit: rows.value,
    sort: sortField.value,
    order: sortOrder.value,
  })
}

const onPage = (event: DataTablePageEvent) => {
  rows.value = event.rows
  loadData(event.page + 1)
}

const onSort = (event: DataTableSortEvent) => {
  if (event.sortField) {
    sortField.value = event.sortField as string
    sortOrder.value = event.sortOrder === 1 ? 'ASC' : 'DESC'
    loadData(1)
  }
}

const handleToggleActive = async (component: StoreComponent) => {
  try {
    await componentsStore.toggleActive(component.id)
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: component.active ? 'Componente desactivado' : 'Componente activado',
      life: 3000,
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al cambiar estado',
      life: 5000,
    })
  }
}

onMounted(() => {
  loadData()
})
</script>
