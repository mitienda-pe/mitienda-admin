<template>
  <div class="promotion-v2-create-view">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <button
        class="rounded-md p-1 text-gray-400 hover:text-gray-600"
        @click="router.push(listRoute)"
      >
        <i class="pi pi-arrow-left text-lg"></i>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="mt-1 text-sm text-gray-500">{{ pageSubtitle }}</p>
      </div>
    </div>

    <!-- Form -->
    <div class="mx-auto max-w-2xl">
      <div class="rounded-lg bg-white p-6 shadow">
        <div class="space-y-5">
          <!-- Coupon code (only in coupon mode) -->
          <div v-if="isCouponMode">
            <label class="block text-sm font-medium text-secondary-700">
              Código del cupón <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="Ej: VERANO2026"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm uppercase"
              :class="{ 'border-red-300': errors.code }"
              @input="form.code = form.code.toUpperCase().trim()"
            />
            <p v-if="errors.code" class="mt-1 text-xs text-red-600">{{ errors.code }}</p>
            <p v-else class="mt-1 text-xs text-gray-400">
              Tus clientes lo escribirán al pagar para obtener el descuento
            </p>
          </div>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-secondary-700">
              Nombre {{ isCouponMode ? '(opcional)' : '' }}
              <span v-if="!isCouponMode" class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              :placeholder="isCouponMode ? 'Ej: Descuento de verano' : 'Ej: Descuento de verano 2026'"
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
              placeholder="Descripción interna..."
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            ></textarea>
          </div>

          <!-- Discount (only in coupon mode) -->
          <template v-if="isCouponMode">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700">
                  Tipo de descuento <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.discount_type"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="percentage_discount_cart">Porcentaje sobre el carrito</option>
                  <option value="fixed_discount_cart">Monto fijo sobre el carrito</option>
                  <option value="free_shipping">Envío gratis</option>
                  <option value="percentage_discount_shipping">Porcentaje sobre el envío</option>
                  <option value="percentage_discount_product">% sobre producto específico</option>
                  <option value="percentage_discount_category">% sobre categoría</option>
                  <option value="percentage_discount_brand">% sobre marca</option>
                </select>
              </div>
              <div v-if="form.discount_type !== 'free_shipping'">
                <label class="block text-sm font-medium text-secondary-700">
                  {{ isPercentageDiscount ? 'Porcentaje (%)' : 'Monto' }}
                  <span class="text-red-500">*</span>
                </label>
                <input
                  v-model.number="form.discount_value"
                  type="number"
                  :min="0"
                  :max="isPercentageDiscount ? 100 : undefined"
                  step="0.01"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  :class="{ 'border-red-300': errors.discount_value }"
                />
                <p v-if="errors.discount_value" class="mt-1 text-xs text-red-600">{{ errors.discount_value }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-secondary-700">Límite de usos</label>
                <input
                  v-model.number="form.max_uses"
                  type="number"
                  min="0"
                  placeholder="Sin límite"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700">Usos por cliente</label>
                <input
                  v-model.number="form.max_uses_per_user"
                  type="number"
                  min="0"
                  placeholder="Sin límite"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
          </template>

          <!-- Priority & Exclusive group (only in promotion mode) -->
          <template v-else>
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

            <!-- Toggle "Acumulable" oculto desde 2026-05-26: política sin
                 stacking. El motor V2 aplica el mejor descuento por slot
                 (carrito + envío). El campo sigue en la BD y en el form data
                 con default false; se mantiene oculto hasta que se reactive
                 el stacking. -->
          </template>

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
                :class="{ 'border-red-300': errors.ends_at }"
              />
              <p v-if="errors.ends_at" class="mt-1 text-xs text-red-600">{{ errors.ends_at }}</p>
              <p v-else class="mt-1 text-xs text-gray-400">Opcional. Sin fecha = sin expiración</p>
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
            @click="router.push(listRoute)"
          >
            Cancelar
          </button>
          <button
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <i v-if="isSubmitting" class="pi pi-spinner pi-spin mr-2"></i>
            {{ submitLabel }}
          </button>
        </div>
      </div>

      <!-- Help Text -->
      <div class="mt-4 rounded-lg bg-primary/5 p-4">
        <div class="flex">
          <i class="pi pi-info-circle mr-2 mt-0.5 text-primary/80"></i>
          <div class="text-sm text-primary">
            <p class="font-medium">{{ helpTitle }}</p>
            <p class="mt-1">{{ helpBody }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePromotionV2Store } from '@/stores/promotion-v2.store'
import { useToast } from 'primevue/usetoast'
import type { PromotionV2Status } from '@/types/promotion-v2.types'
import type { PromotionApiMode, CreateSimpleCouponPayload } from '@/api/promotion-v2.api'

const route = useRoute()
const router = useRouter()
const store = usePromotionV2Store()
const toast = useToast()

const mode = computed<PromotionApiMode>(() => (route.meta.mode as PromotionApiMode) ?? 'promotion')
const isCouponMode = computed(() => mode.value === 'coupon')

const listRoute = computed(() =>
  isCouponMode.value ? '/marketing/coupons' : '/marketing/promotions-v2'
)
const pageTitle = computed(() => (isCouponMode.value ? 'Nuevo cupón' : 'Nueva Promoción'))
const pageSubtitle = computed(() =>
  isCouponMode.value
    ? 'Define un código y el descuento que se aplicará al canjearlo'
    : 'Configura una promoción con el motor de reglas'
)
const submitLabel = computed(() => (isCouponMode.value ? 'Crear cupón' : 'Crear Promoción'))
const helpTitle = computed(() =>
  isCouponMode.value ? 'Listo en un solo paso' : 'Después de crear la promoción'
)
const helpBody = computed(() =>
  isCouponMode.value
    ? 'El cupón quedará disponible para que tus clientes lo ingresen en el checkout. Podrás editarlo o eliminarlo después.'
    : 'Podrás agregar activaciones, condiciones, efectos, restricciones y cupones desde la vista de detalle.'
)

const isSubmitting = ref(false)

const form = reactive({
  // Promotion fields
  name: '',
  description: '',
  priority: 0,
  stackable: false,
  exclusive_group: '',
  starts_at: '',
  ends_at: '',
  status: 'draft' as PromotionV2Status,
  // Coupon-only fields
  code: '',
  discount_type: 'percentage_discount_cart' as CreateSimpleCouponPayload['discount_type'],
  discount_value: 0,
  max_uses: undefined as number | undefined,
  max_uses_per_user: undefined as number | undefined,
})

const errors = reactive({
  name: '',
  code: '',
  discount_value: '',
  starts_at: '',
  ends_at: '',
})

const isPercentageDiscount = computed(() => form.discount_type.startsWith('percentage_'))

onMounted(() => {
  store.setMode(mode.value)
  if (isCouponMode.value) {
    form.status = 'active'
  }
})

function validate(): boolean {
  errors.name = ''
  errors.code = ''
  errors.discount_value = ''
  errors.starts_at = ''
  errors.ends_at = ''

  if (isCouponMode.value) {
    if (!form.code.trim()) {
      errors.code = 'El código del cupón es requerido'
    }
    if (form.discount_type !== 'free_shipping') {
      if (form.discount_value === null || form.discount_value === undefined || form.discount_value <= 0) {
        errors.discount_value = 'Ingresa un valor mayor a cero'
      } else if (isPercentageDiscount.value && form.discount_value > 100) {
        errors.discount_value = 'El porcentaje no puede ser mayor a 100'
      }
    }
  } else {
    if (!form.name.trim()) {
      errors.name = 'El nombre es requerido'
    }
  }

  if (!form.starts_at) {
    errors.starts_at = 'La fecha de inicio es requerida'
  }

  if (form.ends_at && form.starts_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
    errors.ends_at = 'La fecha fin debe ser posterior a la fecha de inicio'
    toast.add({
      severity: 'error',
      summary: 'Error de validación',
      detail: 'La fecha de fin debe ser posterior a la fecha de inicio',
      life: 5000,
    })
  }

  return !errors.name && !errors.code && !errors.discount_value && !errors.starts_at && !errors.ends_at
}

async function handleSubmit() {
  if (!validate()) return

  isSubmitting.value = true
  try {
    if (isCouponMode.value) {
      const payload: CreateSimpleCouponPayload = {
        code: form.code.trim(),
        name: form.name.trim() || undefined,
        description: form.description.trim() || undefined,
        discount_type: form.discount_type,
        discount_value: form.discount_type === 'free_shipping' ? undefined : form.discount_value,
        starts_at: form.starts_at.replace('T', ' '),
        ends_at: form.ends_at ? form.ends_at.replace('T', ' ') : undefined,
        max_uses: form.max_uses,
        max_uses_per_user: form.max_uses_per_user,
        status: form.status,
      }
      const result = await store.addSimpleCoupon(payload)
      if (result) {
        toast.add({ severity: 'success', summary: 'Cupón creado', life: 3000 })
        router.push(`/marketing/coupons/${result.promotions_v2_id}`)
      }
    } else {
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
    }
  } catch {
    // error handled by store; toast shown via captureBlockedByPlan if applicable
  } finally {
    isSubmitting.value = false
  }
}
</script>
