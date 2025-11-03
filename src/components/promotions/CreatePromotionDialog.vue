<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { usePromotionsStore } from '@/stores/promotions.store'
import type { CreatePromotionData, PromotionType } from '@/api/promotions.api'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'created', promotion: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const promotionsStore = usePromotionsStore()
const isLoading = ref(false)
const currentStep = ref(1)

// Form data
const formData = ref<CreatePromotionData>({
  promocion_id: 7, // Default: Bonificaciones
  tiendapromocion_nombre: '',
  tiendapromocion_codigo: '',
  tiendapromocion_tipodescuento: 1,
  tiendapromocion_valor: 0,
  tiendapromocion_ilimitado: 0,
  tiendapromocion_cantidad: 100,
  tiendapromocion_fechainicio: '',
  tiendapromocion_fechacaducidad: '',
  tiendapromocion_estado: 1,
  tiendapromocion_swopciones: 0,
  tiendapromocion_opciones: null,
})

// Calendar dates
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)

// Errors
const errors = ref({
  tiendapromocion_nombre: '',
  tiendapromocion_codigo: '',
  tiendapromocion_valor: '',
  tiendapromocion_fechainicio: '',
  tiendapromocion_fechacaducidad: '',
})

// Computed
const promotionTypes = computed(() => promotionsStore.promotionTypes)

const selectedType = computed(() => {
  return promotionTypes.value.find(t => t.promocion_id === formData.value.promocion_id)
})

const isCouponType = computed(() => {
  const id = Number(formData.value.promocion_id)
  return id === 5 || id === 6
})

const isBonificationType = computed(() => {
  return Number(formData.value.promocion_id) === 7
})

const isComingSoon = computed(() => {
  // Solo Bonificaciones está disponible por ahora
  return Number(formData.value.promocion_id) !== 7
})

const discountTypes = [
  { label: 'Porcentaje (%)', value: 1 },
  { label: 'Monto fijo (S/)', value: 2 }
]

// Watch for date changes
watch([startDate, endDate], ([start, end]) => {
  if (start) {
    formData.value.tiendapromocion_fechainicio = formatDateForAPI(start)
  }
  if (end) {
    formData.value.tiendapromocion_fechacaducidad = formatDateForAPI(end)
  }
})

// Reset form when dialog opens
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    resetForm()
    if (promotionTypes.value.length === 0) {
      promotionsStore.fetchPromotionTypes()
    }
  }
})

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function resetForm() {
  formData.value = {
    promocion_id: 7,
    tiendapromocion_nombre: '',
    tiendapromocion_codigo: '',
    tiendapromocion_tipodescuento: 1,
    tiendapromocion_valor: 0,
    tiendapromocion_ilimitado: 0,
    tiendapromocion_cantidad: 100,
    tiendapromocion_fechainicio: '',
    tiendapromocion_fechacaducidad: '',
    tiendapromocion_estado: 1,
    tiendapromocion_swopciones: 0,
    tiendapromocion_opciones: null,
  }
  startDate.value = null
  endDate.value = null
  errors.value = {
    tiendapromocion_nombre: '',
    tiendapromocion_codigo: '',
    tiendapromocion_valor: '',
    tiendapromocion_fechainicio: '',
    tiendapromocion_fechacaducidad: '',
  }
  currentStep.value = 1
}

function validateStep1(): boolean {
  errors.value = {
    tiendapromocion_nombre: '',
    tiendapromocion_codigo: '',
    tiendapromocion_valor: '',
    tiendapromocion_fechainicio: '',
    tiendapromocion_fechacaducidad: '',
  }

  let isValid = true

  if (!formData.value.tiendapromocion_nombre.trim()) {
    errors.value.tiendapromocion_nombre = 'El nombre es requerido'
    isValid = false
  }

  if (isCouponType.value && !formData.value.tiendapromocion_codigo?.trim()) {
    errors.value.tiendapromocion_codigo = 'El código es requerido para cupones'
    isValid = false
  }

  // No validar valor para bonificaciones
  // if (!formData.value.tiendapromocion_valor || formData.value.tiendapromocion_valor <= 0) {
  //   errors.value.tiendapromocion_valor = 'El valor debe ser mayor a 0'
  //   isValid = false
  // }

  if (!startDate.value) {
    errors.value.tiendapromocion_fechainicio = 'La fecha de inicio es requerida'
    isValid = false
  }

  if (!endDate.value) {
    errors.value.tiendapromocion_fechacaducidad = 'La fecha de fin es requerida'
    isValid = false
  }

  if (startDate.value && endDate.value && endDate.value < startDate.value) {
    errors.value.tiendapromocion_fechacaducidad = 'La fecha de fin debe ser posterior a la de inicio'
    isValid = false
  }

  return isValid
}

async function handleSave() {
  if (!validateStep1()) {
    return
  }

  if (isComingSoon.value) {
    alert('Este tipo de promoción estará disponible próximamente')
    return
  }

  try {
    isLoading.value = true
    const newPromotion = await promotionsStore.addPromotion(formData.value)
    emit('created', newPromotion)
    emit('update:visible', false)
  } catch (error: any) {
    console.error('Error creating promotion:', error)
    alert(error.response?.data?.message || 'Error al crear la promoción')
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :closable="!isLoading"
    :draggable="false"
    header="Crear Nueva Promoción"
    class="w-full md:w-[700px]"
    @update:visible="handleClose"
  >
    <div class="space-y-6">
      <!-- Tipo de Promoción -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Promoción *
        </label>
        <Dropdown
          v-model="formData.promocion_id"
          :options="promotionTypes"
          optionLabel="promocion_nombre"
          optionValue="promocion_id"
          placeholder="Selecciona un tipo"
          class="w-full"
          :disabled="isLoading"
        />
        <small v-if="selectedType" class="text-gray-500">
          {{ selectedType.promocion_denominacion }}
        </small>
      </div>

      <!-- Nombre -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la Promoción *
        </label>
        <InputText
          v-model="formData.tiendapromocion_nombre"
          placeholder="Ej: Descuento Black Friday"
          class="w-full"
          :class="{ 'p-invalid': errors.tiendapromocion_nombre }"
          :disabled="isLoading"
        />
        <small v-if="errors.tiendapromocion_nombre" class="text-red-500">
          {{ errors.tiendapromocion_nombre }}
        </small>
      </div>

      <!-- Coming Soon Warning -->
      <div v-if="isComingSoon" class="rounded-md bg-yellow-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Próximamente disponible</h3>
            <p class="mt-2 text-sm text-yellow-700">
              Este tipo de promoción estará disponible en una próxima actualización.
              Por ahora, solo está disponible el tipo "Bonificaciones".
            </p>
          </div>
        </div>
      </div>

      <!-- Fechas -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Inicio *
          </label>
          <Calendar
            v-model="startDate"
            dateFormat="dd/mm/yy"
            placeholder="Selecciona fecha"
            class="w-full"
            :class="{ 'p-invalid': errors.tiendapromocion_fechainicio }"
            :disabled="isLoading"
            showIcon
          />
          <small v-if="errors.tiendapromocion_fechainicio" class="text-red-500">
            {{ errors.tiendapromocion_fechainicio }}
          </small>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de Fin *
          </label>
          <Calendar
            v-model="endDate"
            dateFormat="dd/mm/yy"
            placeholder="Selecciona fecha"
            class="w-full"
            :class="{ 'p-invalid': errors.tiendapromocion_fechacaducidad }"
            :disabled="isLoading"
            showIcon
          />
          <small v-if="errors.tiendapromocion_fechacaducidad" class="text-red-500">
            {{ errors.tiendapromocion_fechacaducidad }}
          </small>
        </div>
      </div>

      <!-- Estado -->
      <div class="flex items-center gap-2">
        <Checkbox
          v-model="formData.tiendapromocion_estado"
          inputId="estado"
          :binary="true"
          :trueValue="1"
          :falseValue="0"
          :disabled="isLoading"
        />
        <label for="estado" class="text-sm font-medium text-gray-700">
          Activar promoción inmediatamente
        </label>
      </div>

      <!-- Nota informativa -->
      <div v-if="!isComingSoon" class="rounded-md bg-blue-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="pi pi-info-circle text-blue-400"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              Después de crear la promoción básica, serás redirigido a una pantalla completa
              donde podrás configurar los productos base, productos bonificados y las reglas de la promoción.
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="handleClose"
          :disabled="isLoading"
        />
        <Button
          label="Crear Promoción"
          @click="handleSave"
          :loading="isLoading"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-invalid) {
  border-color: #ef4444;
}
</style>
