<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'product-lists' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Lista' : 'Nueva Lista de Productos' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los datos de la lista' : 'Crea una nueva lista de productos' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="saveList" class="space-y-6">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.productolista_nombre"
            class="w-full"
            :class="{ 'p-invalid': errors.productolista_nombre }"
            placeholder="Ej: Productos destacados, Ofertas del mes"
          />
          <small v-if="errors.productolista_nombre" class="text-red-500">{{ errors.productolista_nombre }}</small>
        </div>

        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Tipo de lista <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="tipo in listTypes"
              :key="tipo.value"
              class="border-2 rounded-lg p-4 cursor-pointer transition-all"
              :class="formData.productolista_tipo === tipo.value
                ? 'border-primary bg-primary/5'
                : tipo.disabled
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'"
              @click="!tipo.disabled && (formData.productolista_tipo = tipo.value)"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :class="formData.productolista_tipo === tipo.value ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i :class="tipo.icon" class="text-sm"></i>
                </div>
                <h3 class="font-semibold text-secondary text-sm">{{ tipo.label }}</h3>
              </div>
              <p class="text-xs text-secondary-500">{{ tipo.description }}</p>
              <span v-if="tipo.disabled" class="text-xs text-secondary-400 mt-1 block">Próximamente</span>
            </div>
          </div>
          <small v-if="errors.productolista_tipo" class="text-red-500">{{ errors.productolista_tipo }}</small>
        </div>

        <!-- Cantidad de items (solo para listas smart) -->
        <div v-if="formData.productolista_tipo !== 1">
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Cantidad de productos
          </label>
          <InputNumber
            v-model="formData.productolista_cantidaditems"
            :min="1"
            :max="100"
            class="w-full"
            placeholder="10"
          />
          <small class="text-secondary-500">Cantidad de productos a mostrar en la lista</small>
        </div>

        <!-- Estado -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Estado
          </label>
          <div class="flex items-center gap-3">
            <InputSwitch v-model="isActive" />
            <span class="text-secondary-600">
              {{ isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>

        <!-- Info para listas manuales -->
        <div v-if="formData.productolista_tipo === 1 && !isEditMode" class="bg-blue-50 rounded-lg p-4">
          <div class="flex gap-3">
            <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
            <div>
              <p class="text-sm text-blue-700 font-medium">Lista manual</p>
              <p class="text-xs text-blue-600 mt-1">
                Después de crear la lista, podrás vincular productos usando el botón de vincular en la lista de listas.
              </p>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            label="Cancelar"
            text
            severity="secondary"
            @click="$router.push({ name: 'product-lists' })"
          />
          <Button
            :label="isEditMode ? 'Guardar Cambios' : 'Crear Lista'"
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
import { useProductListStore } from '@/stores/product-list.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import type { ProductListFormData } from '@/types/product-list.types'

const route = useRoute()
const router = useRouter()
const productListStore = useProductListStore()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const formData = ref<ProductListFormData>({
  productolista_nombre: '',
  productolista_tipo: 1,
  productolista_estado: 1,
  productolista_cantidaditems: null
})

const isActive = ref(true)

const listTypes = [
  {
    value: 1,
    label: 'Manual',
    icon: 'pi pi-list',
    description: 'Selecciona manualmente los productos que quieres incluir.',
    disabled: false
  },
  {
    value: 2,
    label: 'Más Vendidos',
    icon: 'pi pi-chart-bar',
    description: 'Se genera automáticamente con los productos más vendidos.',
    disabled: true
  },
  {
    value: 3,
    label: 'Nuevos Productos',
    icon: 'pi pi-star',
    description: 'Se genera automáticamente con los productos más recientes.',
    disabled: true
  }
]

// Sync isActive with formData
watch(isActive, (value) => {
  formData.value.productolista_estado = value ? 1 : 0
})

const isEditMode = computed(() => !!route.params.id)
const listId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.productolista_nombre || formData.value.productolista_nombre.trim().length < 2) {
    errors.value.productolista_nombre = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  if (!formData.value.productolista_tipo) {
    errors.value.productolista_tipo = 'El tipo de lista es requerido'
  }

  return Object.keys(errors.value).length === 0
}

const saveList = async () => {
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

    const payload = {
      productolista_nombre: formData.value.productolista_nombre,
      productolista_tipo: formData.value.productolista_tipo,
      productolista_estado: formData.value.productolista_estado,
      productolista_cantidaditems: formData.value.productolista_tipo !== 1
        ? formData.value.productolista_cantidaditems
        : null
    }

    if (isEditMode.value && listId.value) {
      await productListStore.update(listId.value, payload)

      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'La lista ha sido actualizada correctamente',
        life: 3000
      })
    } else {
      await productListStore.create(payload)

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'La lista ha sido creada correctamente',
        life: 3000
      })
    }

    router.push({ name: 'product-lists' })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.messages?.productolista_nombre || error.response?.data?.message || 'Error al guardar la lista',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const loadList = async () => {
  if (!listId.value) return

  try {
    isLoading.value = true
    const list = await productListStore.fetchById(listId.value)

    if (list) {
      formData.value = {
        productolista_nombre: list.productolista_nombre,
        productolista_tipo: list.productolista_tipo,
        productolista_estado: list.productolista_estado,
        productolista_cantidaditems: list.productolista_cantidaditems
      }
      isActive.value = list.productolista_estado == 1
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la lista',
      life: 5000
    })
    router.push({ name: 'product-lists' })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadList()
  }
})
</script>
