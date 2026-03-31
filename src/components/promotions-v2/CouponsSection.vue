<template>
  <div class="rounded-lg bg-white shadow">
    <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
      <div class="flex items-center gap-2">
        <i class="pi pi-ticket text-primary"></i>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Cupones</h3>
          <p class="text-xs text-gray-500">Códigos de descuento asociados</p>
        </div>
      </div>
      <button
        class="inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
        @click="showAddDialog = true"
      >
        <i class="pi pi-plus mr-1"></i> Agregar cupón
      </button>
    </div>

    <!-- Coupons List -->
    <div v-if="coupons.length === 0" class="px-5 py-6 text-center">
      <p class="text-sm text-gray-400">Sin cupones configurados</p>
    </div>
    <div v-else class="divide-y divide-gray-100">
      <div
        v-for="coupon in coupons"
        :key="coupon.coupon_id"
        class="flex items-center justify-between px-5 py-3"
      >
        <div>
          <code class="rounded bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-800">
            {{ coupon.code }}
          </code>
          <div class="mt-1 flex gap-3 text-xs text-gray-500">
            <span>
              Usos: {{ coupon.used_count }}<template v-if="coupon.max_uses">/{{ coupon.max_uses }}</template>
              <template v-else> (ilimitado)</template>
            </span>
            <span>Por usuario: {{ coupon.max_uses_per_user }}</span>
            <span v-if="coupon.expires_at">
              Expira: {{ formatDate(coupon.expires_at) }}
            </span>
          </div>
        </div>
        <button
          class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Eliminar"
          @click="handleDelete(coupon.coupon_id)"
        >
          <i class="pi pi-trash text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Add Coupon Dialog -->
    <Dialog
      v-model:visible="showAddDialog"
      :modal="true"
      header="Agregar cupón"
      :style="{ width: '450px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-secondary-700">
            Código <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="couponForm.code"
            placeholder="Ej: VERANO2026"
            class="w-full font-mono uppercase"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-secondary-700">Máximo usos</label>
            <InputNumber
              v-model="couponForm.max_uses"
              :min="1"
              placeholder="Ilimitado"
              class="w-full"
              inputClass="w-full"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-secondary-700">Usos por usuario</label>
            <InputNumber
              v-model="couponForm.max_uses_per_user"
              :min="1"
              class="w-full"
              inputClass="w-full"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-secondary-700">Fecha expiración</label>
          <Calendar
            v-model="couponExpiresDate"
            :showTime="true"
            :showIcon="true"
            dateFormat="dd/mm/yy"
            placeholder="Sin expiración"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showAddDialog = false"
        />
        <Button
          label="Crear cupón"
          :disabled="!couponForm.code.trim()"
          @click="handleAdd"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import { usePromotionV2Store } from '@/stores/promotion-v2.store'
import { useFormatters } from '@/composables/useFormatters'
import type { PromotionV2Coupon } from '@/types/promotion-v2.types'

const props = defineProps<{
  coupons: PromotionV2Coupon[]
  promotionId: number
}>()

const store = usePromotionV2Store()
const { formatDate } = useFormatters()

const showAddDialog = ref(false)

const couponForm = reactive({
  code: '',
  max_uses: null as number | null,
  max_uses_per_user: 1,
})

const couponExpiresDate = ref<Date | null>(null)

function resetForm() {
  couponForm.code = ''
  couponForm.max_uses = null
  couponForm.max_uses_per_user = 1
  couponExpiresDate.value = null
}

function formatDateForApi(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:00`
}

async function handleAdd() {
  if (!couponForm.code.trim()) return

  await store.createCoupon(props.promotionId, {
    code: couponForm.code.trim().toUpperCase(),
    max_uses: couponForm.max_uses || undefined,
    max_uses_per_user: couponForm.max_uses_per_user,
    expires_at: couponExpiresDate.value ? formatDateForApi(couponExpiresDate.value) : undefined,
  })

  resetForm()
  showAddDialog.value = false
}

async function handleDelete(couponId: number) {
  await store.removeCoupon(props.promotionId, couponId)
}
</script>
