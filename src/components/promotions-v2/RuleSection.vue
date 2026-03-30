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
        class="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium"
        :class="isMaxReached
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-primary/10 text-primary hover:bg-primary/20'"
        :disabled="isMaxReached"
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
          <div class="mt-1 text-xs text-gray-500">
            {{ formatConfigHumanReadable(rule.type, rule.config) }}
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
      :style="{ width: '550px' }"
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

        <!-- Type-specific form (when schema exists) -->
        <div v-if="dialogForm.type && !advancedMode && useFormMode">
          <RuleConfigForm
            :ruleCategory="ruleCategory"
            :type="dialogForm.type"
            v-model="configObject"
          />
        </div>

        <!-- JSON textarea (advanced mode or fallback) -->
        <div v-else-if="dialogForm.type && (advancedMode || !useFormMode)">
          <label class="block text-sm font-medium text-secondary-700">Configuraci&oacute;n (JSON)</label>
          <textarea
            v-model="configText"
            rows="5"
            placeholder='{"key": "value"}'
            class="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-primary focus:ring-primary"
            :class="{ 'border-red-300': configError }"
          ></textarea>
          <p v-if="configError" class="mt-1 text-xs text-red-600">{{ configError }}</p>
        </div>

        <!-- Toggle advanced mode (only when type has form fields) -->
        <div v-if="dialogForm.type && hasFields" class="flex items-center justify-end">
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700"
            @click="toggleAdvancedMode"
          >
            <i class="pi pi-code mr-1"></i>
            {{ advancedMode ? 'Modo formulario' : 'Modo avanzado (JSON)' }}
          </button>
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
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import RuleConfigForm from './RuleConfigForm.vue'
import {
  hasConfigFields,
  isKnownType,
  formatConfigHuman,
  type RuleCategory,
} from '@/config/promotion-v2-config-schemas'

const props = withDefaults(defineProps<{
  title: string
  description: string
  icon: string
  rules: any[]
  typeLabels: Record<string, string>
  validTypes: string[]
  idField: string
  ruleCategory: RuleCategory
  maxRules?: number
}>(), {
  maxRules: 0, // 0 = unlimited
})

const emit = defineEmits<{
  add: [data: { type: string; config: Record<string, any> | null }]
  update: [id: number, data: { type: string; config: Record<string, any> | null }]
  delete: [id: number]
}>()

const isMaxReached = computed(() =>
  props.maxRules > 0 && props.rules.length >= props.maxRules
)

const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const configError = ref('')
const advancedMode = ref(false)

const dialogForm = reactive({
  type: '',
})
const configText = ref('')
const configObject = ref<Record<string, any>>({})

// True when the type has actual form fields (for toggle button visibility)
const hasFields = computed(() =>
  dialogForm.type ? hasConfigFields(props.ruleCategory, dialogForm.type) : false
)

// True when the type is registered (even with empty schema) → use form, not JSON fallback
const useFormMode = computed(() =>
  dialogForm.type ? isKnownType(props.ruleCategory, dialogForm.type) : false
)

// Sync configObject <-> configText when toggling modes
watch(advancedMode, (isAdvanced) => {
  if (isAdvanced) {
    // Form → JSON
    configText.value = Object.keys(configObject.value).length > 0
      ? JSON.stringify(configObject.value, null, 2)
      : ''
  } else {
    // JSON → Form
    try {
      const parsed = configText.value.trim() ? JSON.parse(configText.value) : {}
      configObject.value = parsed
      configError.value = ''
    } catch {
      // Keep current configObject if JSON is invalid
    }
  }
})

// Reset config when type changes
watch(() => dialogForm.type, () => {
  configObject.value = {}
  configText.value = ''
  configError.value = ''
  advancedMode.value = false
})

function formatConfigHumanReadable(type: string, config: Record<string, any> | null): string {
  return formatConfigHuman(props.ruleCategory, type, config)
}

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  dialogForm.type = ''
  configText.value = ''
  configObject.value = {}
  configError.value = ''
  advancedMode.value = false
  showDialog.value = true
}

function openEditDialog(rule: any) {
  isEditing.value = true
  editingId.value = rule[props.idField]
  dialogForm.type = rule.type
  const existingConfig = rule.config || {}
  configObject.value = { ...existingConfig }
  configText.value = Object.keys(existingConfig).length > 0
    ? JSON.stringify(existingConfig, null, 2)
    : ''
  configError.value = ''
  advancedMode.value = false
  showDialog.value = true
}

function getConfig(): Record<string, any> | null | undefined {
  if (advancedMode.value || !useFormMode.value) {
    // Parse JSON text
    const text = configText.value.trim()
    if (!text) return null
    try {
      const parsed = JSON.parse(text)
      configError.value = ''
      return parsed
    } catch {
      configError.value = 'JSON inv\u00e1lido'
      return undefined
    }
  } else {
    // Use form object
    return Object.keys(configObject.value).length > 0 ? configObject.value : null
  }
}

async function handleSave() {
  const config = getConfig()
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

function toggleAdvancedMode() {
  advancedMode.value = !advancedMode.value
}
</script>
