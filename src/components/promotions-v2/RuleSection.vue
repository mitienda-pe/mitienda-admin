<template>
  <div class="rounded-lg bg-white shadow">
    <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <div class="flex items-center gap-2">
        <i :class="icon" class="text-primary"></i>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">{{ title }}</h3>
          <p class="text-xs text-gray-500">{{ description }}</p>
        </div>
      </div>
      <button
        class="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
        @click="openAddDialog"
      >
        <i class="pi pi-plus mr-1"></i> Agregar
      </button>
    </div>

    <!-- Rules List -->
    <div v-if="rules.length === 0" class="px-5 py-6 text-center">
      <p class="text-sm text-gray-400">Sin reglas configuradas</p>
    </div>
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="rule in rules"
        :key="rule[idField]"
        class="flex items-center justify-between px-5 py-3"
      >
        <div>
          <span class="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {{ typeLabels[rule.type as keyof typeof typeLabels] || rule.type }}
          </span>
          <div v-if="rule.config" class="mt-1 text-xs text-gray-500">
            <code class="rounded bg-gray-50 px-1 py-0.5">{{ formatConfig(rule.config) }}</code>
          </div>
        </div>
        <div class="flex gap-1">
          <button
            class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Editar"
            @click="openEditDialog(rule)"
          >
            <i class="pi pi-pencil text-xs"></i>
          </button>
          <button
            class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Eliminar"
            @click="handleDelete(rule[idField])"
          >
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <Dialog
      v-model:visible="showDialog"
      :modal="true"
      :header="isEditing ? 'Editar regla' : 'Agregar regla'"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700">Tipo</label>
          <select
            v-model="dialogForm.type"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option value="">Seleccionar tipo...</option>
            <option v-for="t in validTypes" :key="t" :value="t">
              {{ typeLabels[t as keyof typeof typeLabels] || t }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700">Configuración (JSON)</label>
          <textarea
            v-model="configText"
            rows="5"
            placeholder='{"key": "value"}'
            class="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-primary focus:ring-primary"
            :class="{ 'border-red-300': configError }"
          ></textarea>
          <p v-if="configError" class="mt-1 text-xs text-red-600">{{ configError }}</p>
        </div>
      </div>
      <template #footer>
        <button
          class="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showDialog = false"
        >
          Cancelar
        </button>
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          :disabled="!dialogForm.type"
          @click="handleSave"
        >
          {{ isEditing ? 'Guardar' : 'Agregar' }}
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import Dialog from 'primevue/dialog'

const props = defineProps<{
  title: string
  description: string
  icon: string
  rules: any[]
  typeLabels: Record<string, string>
  validTypes: string[]
  idField: string
}>()

const emit = defineEmits<{
  add: [data: { type: string; config: Record<string, any> | null }]
  update: [id: number, data: { type: string; config: Record<string, any> | null }]
  delete: [id: number]
}>()

const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const configError = ref('')

const dialogForm = reactive({
  type: '',
})
const configText = ref('')

function formatConfig(config: Record<string, any>): string {
  return JSON.stringify(config)
}

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  dialogForm.type = ''
  configText.value = ''
  configError.value = ''
  showDialog.value = true
}

function openEditDialog(rule: any) {
  isEditing.value = true
  editingId.value = rule[props.idField]
  dialogForm.type = rule.type
  configText.value = rule.config ? JSON.stringify(rule.config, null, 2) : ''
  configError.value = ''
  showDialog.value = true
}

function parseConfig(): Record<string, any> | null {
  const text = configText.value.trim()
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    configError.value = ''
    return parsed
  } catch {
    configError.value = 'JSON inválido'
    return undefined as any
  }
}

async function handleSave() {
  const config = parseConfig()
  if (config === undefined) return // parse error

  const data = { type: dialogForm.type, config }

  if (isEditing.value && editingId.value !== null) {
    emit('update', editingId.value, data)
  } else {
    emit('add', data)
  }

  showDialog.value = false
}

function handleDelete(id: number) {
  emit('delete', id)
}
</script>
