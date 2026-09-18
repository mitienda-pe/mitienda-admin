<template>
  <Dialog
    :visible="visible"
    header="Nuevo Atributo"
    :modal="true"
    :style="{ width: '500px' }"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre</label>
        <InputText
          v-model="form.name"
          placeholder="Ej: Color, Talla, Versión"
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
        />
        <small
          v-if="errors.name"
          class="text-red-500"
        >{{ errors.name }}</small>
      </div>

      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo</label>
        <Dropdown
          v-model="form.type"
          :options="typeOptions"
          option-label="label"
          option-value="value"
          placeholder="Seleccionar tipo"
          class="w-full"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Estilo de visualización</label>
        <div class="flex gap-4">
          <div class="flex items-center gap-2">
            <RadioButton
              v-model="form.style"
              :value="1"
              input-id="attr-style-rect"
            />
            <label
              for="attr-style-rect"
              class="text-sm"
            >Rectangular</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton
              v-model="form.style"
              :value="2"
              input-id="attr-style-circle"
            />
            <label
              for="attr-style-circle"
              class="text-sm"
            >Circular</label>
          </div>
        </div>
      </div>

      <!-- Color type: skip options here, add them in detail view -->
      <div
        v-if="form.type === 2"
        class="bg-primary/5 rounded-lg p-3"
      >
        <p class="text-sm text-primary">
          <i class="pi pi-info-circle mr-1" />
          Los colores se agregan con el color picker en la vista de detalle del atributo.
        </p>
      </div>

      <!-- Non-color options input -->
      <div v-else>
        <label class="block text-sm font-medium text-secondary-700 mb-1">
          Opciones iniciales <span class="text-secondary-400">(opcional)</span>
        </label>
        <Chips
          v-model="form.options"
          placeholder="Escribe y presiona Enter"
          class="w-full"
        />
        <small class="text-secondary-400">{{ optionsHint }}</small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          @click="close"
        />
        <Button
          label="Crear Atributo"
          icon="pi pi-check"
          :loading="store.isLoading"
          @click="handleCreate"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
/**
 * Alta de un atributo de tienda.
 *
 * Vive como componente y no dentro de la vista del catálogo porque el editor de
 * variantes también lo abre: una tienda sin ningún atributo tenía que salir de
 * la ficha del producto, crearlo en otra vista y volver.
 */
import { ref, computed } from 'vue'
import { useAttributesStore } from '@/stores/attributes.store'
import type { AttributeType, AttributeStyle } from '@/types/attribute.types'
import Button from 'primevue/button'
import Chips from 'primevue/chips'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import { useToast } from 'primevue/usetoast'

const props = withDefaults(
  defineProps<{
    visible: boolean
    /**
     * Desde el editor de variantes las opciones se escriben en la propia fila,
     * así que el texto de ayuda cambia: acá solo hacen falta las que se repiten.
     */
    context?: 'catalog' | 'variants'
  }>(),
  { context: 'catalog' }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  created: [id: number, name: string]
}>()

const store = useAttributesStore()
const toast = useToast()

const form = ref({
  name: '',
  type: 1 as AttributeType,
  style: 1 as AttributeStyle,
  options: [] as string[],
})

const errors = ref<Record<string, string>>({})

const typeOptions = [
  { label: 'Texto / Combo', value: 1 },
  { label: 'Color', value: 2 },
  { label: 'Botón', value: 3 },
  { label: 'Imagen', value: 4 },
]

const optionsHint = computed(() =>
  props.context === 'variants'
    ? 'Si cada producto usa valores distintos, dejalo vacío: podés escribirlos en cada variante.'
    : 'Puedes agregar más opciones después'
)

function reset() {
  form.value = { name: '', type: 1, style: 1, options: [] }
  errors.value = {}
}

function close() {
  emit('update:visible', false)
  reset()
}

async function handleCreate() {
  errors.value = {}

  const name = form.value.name.trim()
  if (!name) {
    errors.value.name = 'El nombre es requerido'
    return
  }

  const id = await store.createAttribute({
    name,
    type: form.value.type,
    style: form.value.style,
    options: form.value.options,
  })

  if (!id) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo crear el atributo',
      life: 5000,
    })
    return
  }

  toast.add({
    severity: 'success',
    summary: 'Atributo creado',
    detail: `Se creó el atributo "${name}"`,
    life: 3000,
  })

  emit('created', id, name)
  emit('update:visible', false)
  reset()
}
</script>
