<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'gammas-list' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Gamma' : 'Nueva Gamma' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los datos de la gamma' : 'Crea una nueva gamma para tus productos' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="saveGamma" class="space-y-6">
        <!-- Marca -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Marca <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="formData.tiendamarca_id"
            :options="catalogStore.brands"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar marca"
            class="w-full"
            :class="{ 'p-invalid': errors.tiendamarca_id }"
          />
          <small v-if="errors.tiendamarca_id" class="text-red-500">{{ errors.tiendamarca_id }}</small>
        </div>

        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.tiendagamma_nombre"
            class="w-full"
            :class="{ 'p-invalid': errors.tiendagamma_nombre }"
            placeholder="Ej: MacBook, Walkman, Corvette"
          />
          <small v-if="errors.tiendagamma_nombre" class="text-red-500">{{ errors.tiendagamma_nombre }}</small>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Descripción
          </label>
          <Textarea
            v-model="formData.tiendagamma_descripcion"
            class="w-full"
            rows="3"
            placeholder="Descripción opcional de la gamma"
          />
        </div>

        <!-- Opciones -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Estado -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Estado
            </label>
            <div class="flex items-center gap-3">
              <InputSwitch v-model="isPublished" />
              <span class="text-secondary-600">
                {{ isPublished ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>

          <!-- Orden -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Orden
            </label>
            <InputNumber
              v-model="formData.tiendagamma_orden"
              :min="0"
              class="w-full"
              placeholder="0"
            />
            <small class="text-secondary-500">Menor número = aparece primero</small>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            label="Cancelar"
            text
            severity="secondary"
            @click="$router.push({ name: 'gammas-list' })"
          />
          <Button
            :label="isEditMode ? 'Guardar Cambios' : 'Crear Gamma'"
            type="submit"
            :loading="isSaving"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGammaStore } from '@/stores/gamma.store'
import { useCatalogStore } from '@/stores/catalog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import type { GammaFormData } from '@/types/gamma.types'

const route = useRoute()
const router = useRouter()
const gammaStore = useGammaStore()
const catalogStore = useCatalogStore()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const formData = ref<GammaFormData>({
  tiendamarca_id: null,
  tiendagamma_nombre: '',
  tiendagamma_descripcion: '',
  tiendagamma_swpublicado: 1,
  tiendagamma_orden: 0
})

const isPublished = ref(true)

// Sync isPublished with formData
watch(isPublished, (value) => {
  formData.value.tiendagamma_swpublicado = value ? 1 : 0
})

const isEditMode = computed(() => !!route.params.id)
const gammaId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.tiendamarca_id) {
    errors.value.tiendamarca_id = 'La marca es requerida'
  }

  if (!formData.value.tiendagamma_nombre || formData.value.tiendagamma_nombre.trim().length < 2) {
    errors.value.tiendagamma_nombre = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  return Object.keys(errors.value).length === 0
}

const saveGamma = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Por favor completa los campos requeridos',
      life: 3000
    })
    return
  }

  try {
    isSaving.value = true

    if (isEditMode.value && gammaId.value) {
      await gammaStore.update(gammaId.value, {
        tiendamarca_id: formData.value.tiendamarca_id!,
        tiendagamma_nombre: formData.value.tiendagamma_nombre,
        tiendagamma_descripcion: formData.value.tiendagamma_descripcion,
        tiendagamma_swpublicado: formData.value.tiendagamma_swpublicado,
        tiendagamma_orden: formData.value.tiendagamma_orden
      })

      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'La gamma ha sido actualizada correctamente',
        life: 3000
      })
    } else {
      await gammaStore.create({
        tiendamarca_id: formData.value.tiendamarca_id!,
        tiendagamma_nombre: formData.value.tiendagamma_nombre,
        tiendagamma_descripcion: formData.value.tiendagamma_descripcion,
        tiendagamma_swpublicado: formData.value.tiendagamma_swpublicado,
        tiendagamma_orden: formData.value.tiendagamma_orden
      })

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'La gamma ha sido creada correctamente',
        life: 3000
      })
    }

    router.push({ name: 'gammas-list' })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar la gamma',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const loadGamma = async () => {
  if (!gammaId.value) return

  try {
    isLoading.value = true
    const gamma = await gammaStore.fetchById(gammaId.value)

    if (gamma) {
      formData.value = {
        tiendamarca_id: gamma.tiendamarca_id,
        tiendagamma_nombre: gamma.tiendagamma_nombre,
        tiendagamma_descripcion: gamma.tiendagamma_descripcion || '',
        tiendagamma_swpublicado: gamma.tiendagamma_swpublicado,
        tiendagamma_orden: gamma.tiendagamma_orden
      }
      isPublished.value = gamma.tiendagamma_swpublicado == 1
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la gamma',
      life: 5000
    })
    router.push({ name: 'gammas-list' })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // Cargar marcas
  if (catalogStore.brands.length === 0) {
    await catalogStore.fetchBrands()
  }

  // Si es modo edición, cargar la gamma
  if (isEditMode.value) {
    await loadGamma()
  }
})
</script>
