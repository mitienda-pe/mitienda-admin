<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
      <i class="pi pi-gift text-primary"></i>
      {{ status ? status.program.name : '¿Vienes de un programa?' }}
    </h2>

    <div v-if="loading" class="text-sm text-secondary-500">Cargando…</div>

    <!-- Sin programa: inscribirse con el código -->
    <div v-else-if="!status">
      <p class="text-sm text-secondary-600 mb-3">
        Si tu negocio participa en un programa con convenio (por ejemplo, Tu Empresa del Ministerio de la Producción),
        ingresa su código para activar el beneficio.
      </p>
      <div class="flex flex-col sm:flex-row gap-2 sm:items-start max-w-md">
        <AppInput v-model="code" placeholder="Código del programa" class="flex-1" />
        <AppButton label="Activar beneficio" :loading="enrolling" :disabled="!code.trim()" @click="enroll" />
      </div>
      <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
    </div>

    <!-- Inscrita: meses ganados y qué falta -->
    <div v-else class="space-y-4">
      <p class="text-sm text-secondary-600">
        Inscrita el {{ formatDate(status.enrolled_at) }}. Tu prueba gratis llega hasta el
        <strong>{{ formatDate(status.covered_until) }}</strong>.
      </p>

      <ul class="space-y-2">
        <li v-for="month in status.months" :key="month.month" class="flex items-start gap-3 text-sm">
          <i class="pi mt-0.5" :class="monthIcon(month)"></i>
          <div>
            <div class="font-medium text-secondary">
              Mes {{ month.month }} · {{ formatDate(month.from) }} al {{ formatDate(month.until) }}
            </div>
            <div class="text-secondary-500">{{ monthText(month) }}</div>
          </div>
        </li>
      </ul>

      <div v-if="!status.signals.configured || !status.signals.domain" class="border-t border-gray-100 pt-4">
        <div class="text-sm font-medium text-secondary mb-2">Lo que falta</div>
        <ul class="text-sm space-y-1">
          <li v-for="item in checklist" :key="item.label" class="flex items-center gap-2">
            <i class="pi" :class="item.done ? 'pi-check-circle text-green-600' : 'pi-circle text-secondary-300'"></i>
            <span :class="item.done ? 'text-secondary-500 line-through' : 'text-secondary-700'">{{ item.label }}</span>
          </li>
        </ul>
      </div>

      <p v-if="status.annual_discount.available" class="text-sm bg-primary-50 text-secondary-700 rounded p-3">
        Al pasar a un plan pagado tienes <strong>{{ status.annual_discount.percent }} % de descuento</strong> en el primer
        año de cualquier plan anual. Escríbenos para activarlo.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AppButton, AppInput } from '@/components/ui'
import { useFormatters } from '@/composables/useFormatters'
import { programsApi, type ProgramMonth, type ProgramStatus } from '@/api/programs.api'

const emit = defineEmits<{ (e: 'enrolled'): void }>()

const { formatDate } = useFormatters()
const status = ref<ProgramStatus | null>(null)
const loading = ref(true)
const code = ref('')
const enrolling = ref(false)
const error = ref<string | null>(null)

const checklist = computed(() => {
  const s = status.value?.signals
  if (!s) return []
  return [
    { label: 'Al menos un producto publicado', done: s.products },
    { label: 'Una forma de pago activa', done: s.payment },
    { label: 'Envío a domicilio con zonas, recojo en tienda con su dirección, o un courier', done: s.shipping },
    { label: 'Tu dominio propio conectado y verificado', done: s.domain }
  ]
})

function monthIcon(month: ProgramMonth): string {
  if (month.earned) return 'pi-check-circle text-green-600'
  if (month.lost) return 'pi-times-circle text-secondary-300'
  return 'pi-clock text-amber-500'
}

function monthText(month: ProgramMonth): string {
  if (month.month === 1) return 'Gratis por inscribirte'
  const condition = month.condition === 'configured' ? 'configurar tu tienda' : 'conectar tu dominio propio'
  if (month.earned) return `Ganado por ${condition}`
  if (month.lost) return `No se ganó: faltó ${condition} a tiempo`
  return `Se gana al ${condition}`
}

async function load() {
  loading.value = true
  try {
    status.value = (await programsApi.getStatus()).data ?? null
  } catch {
    status.value = null
  } finally {
    loading.value = false
  }
}

async function enroll() {
  enrolling.value = true
  error.value = null
  try {
    status.value = (await programsApi.enroll(code.value.trim())).data ?? null
    emit('enrolled')
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'No se pudo activar el beneficio'
  } finally {
    enrolling.value = false
  }
}

onMounted(load)
</script>
