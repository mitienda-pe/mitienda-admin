<template>
  <div class="promotion-v2-create-view">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <button
        class="rounded-md p-1 text-gray-400 hover:text-gray-600"
        @click="router.push('/marketing/promotions-v2')"
      >
        <i class="pi pi-arrow-left text-lg"></i>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nueva Promoción</h1>
        <p class="mt-1 text-sm text-gray-500">Configura una promoción con el motor de reglas</p>
      </div>
    </div>

    <!-- Form -->
    <div class="mx-auto max-w-2xl">
      <div class="rounded-lg bg-white p-6 shadow">
        <div class="space-y-5">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-secondary-700">
              Nombre <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Ej: Descuento de verano 2026"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              :class="{ 'border-red-300': errors.name }"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-secondary-700">Descripción</label>
            <textarea
              v-model="form.description"
              rows="3"
              placeholder="Descripción interna de la promoción..."
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            ></textarea>
          </div>

          <!-- Priority & Stackable -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700">Prioridad</label>
              <input
                v-model.number="form.priority"
                type="number"
                min="0"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-400">Mayor número = mayor prioridad</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700">Grupo exclusivo</label>
              <input
                v-model="form.exclusive_group"
                type="text"
                placeholder="Opcional"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-400">Solo 1 del grupo se aplica</p>
            </div>
          </div>

          <div>
            <label class="flex items-center">
              <input
                v-model="form.stackable"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-gray-700">Acumulable con otras promociones</span>
            </label>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700">
                Fecha inicio <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.starts_at"
                type="datetime-local"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                :class="{ 'border-red-300': errors.starts_at }"
              />
              <p v-if="errors.starts_at" class="mt-1 text-xs text-red-600">{{ errors.starts_at }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700">Fecha fin</label>
              <input
                v-model="form.ends_at"
                type="datetime-local"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
              <p class="mt-1 text-xs text-gray-400">Opcional. Sin fecha = sin expiración</p>
            </div>
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-secondary-700">Estado inicial</label>
            <select
              v-model="form.status"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="draft">Borrador</option>
              <option value="scheduled">Programada</option>
              <option value="active">Activa</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="router.push('/marketing/promotions-v2')"
          >
            Cancelar
          </button>
          <button
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <i v-if="isSubmitting" class="pi pi-spinner pi-spin mr-2"></i>
            Crear Promoción
          </button>
        </div>
      </div>

      <!-- Help Text -->
      <div class="mt-4 rounded-lg bg-blue-50 p-4">
        <div class="flex">
          <i class="pi pi-info-circle mr-2 mt-0.5 text-blue-500"></i>
          <div class="text-sm text-blue-700">
            <p class="font-medium">Después de crear la promoción</p>
            <p class="mt-1">
              Podrás agregar activaciones, condiciones, efectos, restricciones y cupones
              desde la vista de detalle.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { usePromotionV2Store } from '@/stores/promotion-v2.store'
import type { PromotionV2Status } from '@/types/promotion-v2.types'

const router = useRouter()
const store = usePromotionV2Store()

const isSubmitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  priority: 0,
  stackable: false,
  exclusive_group: '',
  starts_at: '',
  ends_at: '',
  status: 'draft' as PromotionV2Status,
})

const errors = reactive({
  name: '',
  starts_at: '',
})

function validate(): boolean {
  errors.name = ''
  errors.starts_at = ''

  if (!form.name.trim()) {
    errors.name = 'El nombre es requerido'
  }

  if (!form.starts_at) {
    errors.starts_at = 'La fecha de inicio es requerida'
  }

  return !errors.name && !errors.starts_at
}

async function handleSubmit() {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const result = await store.addPromotion({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      stackable: form.stackable ? 1 : 0,
      exclusive_group: form.exclusive_group.trim() || undefined,
      starts_at: form.starts_at.replace('T', ' '),
      ends_at: form.ends_at ? form.ends_at.replace('T', ' ') : undefined,
      status: form.status,
    })

    if (result) {
      router.push(`/marketing/promotions-v2/${result.promotions_v2_id}`)
    }
  } catch {
    // error handled by store
  } finally {
    isSubmitting.value = false
  }
}
</script>
