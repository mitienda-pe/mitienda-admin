<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import { usePromotionsStore } from '@/stores/promotions.store'
import type { Promotion } from '@/api/promotions.api'

interface Props {
  visible: boolean
  promotion: Promotion | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated', promotion: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const promotionsStore = usePromotionsStore()
const isLoading = ref(false)

// Form data
const formData = ref({
  tiendapromocion_nombre: '',
  tiendapromocion_codigo: '',
  tiendapromocion_fechainicio: '',
  tiendapromocion_fechacaducidad: '',
})

// Calendar dates
const startDate = ref<Date | null>(null)
const endDate = ref<Date | null>(null)

// Errors
const errors = ref({
  tiendapromocion_nombre: '',
  tiendapromocion_fechainicio: '',
  tiendapromocion_fechacaducidad: '',
})

// Watch for promotion changes
watch(() => props.promotion, (promotion) => {
  if (promotion) {
    formData.value = {
      tiendapromocion_nombre: promotion.tiendapromocion_nombre,
      tiendapromocion_codigo: promotion.tiendapromocion_codigo || '',
      tiendapromocion_fechainicio: promotion.tiendapromocion_fechainicio,
      tiendapromocion_fechacaducidad: promotion.tiendapromocion_fechacaducidad,
    }

    // Parse dates
    if (promotion.tiendapromocion_fechainicio) {
      startDate.value = new Date(promotion.tiendapromocion_fechainicio)
    }
    if (promotion.tiendapromocion_fechacaducidad) {
      endDate.value = new Date(promotion.tiendapromocion_fechacaducidad)
    }
  }
}, { immediate: true })

// Watch for date changes
watch([startDate, endDate], ([start, end]) => {
  if (start) {
    formData.value.tiendapromocion_fechainicio = formatDateForAPI(start)
  }
  if (end) {
    formData.value.tiendapromocion_fechacaducidad = formatDateForAPI(end)
  }
})

function formatDateForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function validateForm(): boolean {
  errors.value = {
    tiendapromocion_nombre: '',
    tiendapromocion_fechainicio: '',
    tiendapromocion_fechacaducidad: '',
  }

  let isValid = true

  if (!formData.value.tiendapromocion_nombre.trim()) {
    errors.value.tiendapromocion_nombre = 'El nombre es requerido'
    isValid = false
  }

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
  if (!props.promotion || !validateForm()) {
    return
  }

  try {
    isLoading.value = true
    const updatedPromotion = await promotionsStore.modifyPromotion(
      props.promotion.tiendapromocion_id,
      formData.value
    )
    emit('updated', updatedPromotion)
    emit('update:visible', false)
  } catch (error: any) {
    console.error('Error updating promotion:', error)
    alert(error.response?.data?.message || 'Error al actualizar la promoción')
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
    header="Editar Promoción"
    class="w-full md:w-[600px]"
    @update:visible="handleClose"
  >
    <div class="space-y-4">
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

      <!-- Código (optional) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Código
        </label>
        <InputText
          v-model="formData.tiendapromocion_codigo"
          placeholder="Ej: BF2024"
          class="w-full"
          :disabled="isLoading"
        />
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
          label="Guardar Cambios"
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
