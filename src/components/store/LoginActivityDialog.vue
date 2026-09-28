<script setup lang="ts">
/**
 * Actividad de ingresos de un usuario o cajero en la tienda.
 *
 * Lo usan Usuarios y Cajeros POS: cada pantalla pasa su propio `loader`
 * porque los endpoints y los espacios de IDs son distintos.
 */
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { useFormatters } from '@/composables/useFormatters'
import type { LoginActivity, LoginChannel } from '@/types/login-activity.types'

const props = defineProps<{
  title: string
  subtitle?: string
  loader: () => Promise<LoginActivity | null>
}>()

const visible = defineModel<boolean>('visible', { required: true })

const { formatDateTime } = useFormatters()

const activity = ref<LoginActivity | null>(null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)

watch(visible, async open => {
  if (!open) return
  activity.value = null
  loadError.value = null
  isLoading.value = true
  try {
    activity.value = await props.loader()
  } catch (e: any) {
    loadError.value = e?.response?.data?.message || e?.message || 'No se pudo cargar la actividad'
  } finally {
    isLoading.value = false
  }
})

const CHANNEL_LABEL: Record<LoginChannel, string> = {
  backoffice: 'Panel web',
  pos: 'POS',
  app: 'App móvil'
}

function channelLabel(channel: string): string {
  return CHANNEL_LABEL[channel as LoginChannel] ?? channel
}

/** Los últimos 30 días completos, con cero en los días sin ingresos. */
const dailySeries = computed(() => {
  const counts = new Map((activity.value?.daily ?? []).map(d => [d.day, d.total]))
  const days: { day: string; total: number }[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ day: key, total: counts.get(key) ?? 0 })
  }
  return days
})

const dailyMax = computed(() => Math.max(1, ...dailySeries.value.map(d => d.total)))

const activeDays = computed(() => dailySeries.value.filter(d => d.total > 0).length)

function dayLabel(day: string): string {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

/** Resumen legible del user-agent: "Chrome · Android". */
function deviceLabel(ua: string | null): string {
  if (!ua) return '—'
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad|iOS/i.test(ua)
      ? 'iOS'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : ''
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : /okhttp|Dart|Ktor/i.test(ua)
            ? 'App'
            : ''
  return [browser, os].filter(Boolean).join(' · ') || ua.slice(0, 40)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="title"
    :style="{ width: '640px' }"
    :breakpoints="{ '768px': '95vw' }"
    :modal="true"
  >
    <p v-if="subtitle" class="text-sm text-gray-500 -mt-2 mb-4">{{ subtitle }}</p>

    <div v-if="isLoading" class="flex justify-center py-10">
      <i class="pi pi-spinner pi-spin text-3xl text-primary" />
    </div>

    <div v-else-if="loadError" class="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
      {{ loadError }}
    </div>

    <div
      v-else-if="activity && !activity.available"
      class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800"
    >
      El registro de ingresos no está disponible en este momento. Intenta de nuevo más tarde.
    </div>

    <div v-else-if="activity" class="space-y-6">
      <!-- Totales -->
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-lg border border-gray-200 p-3">
          <p class="text-xs text-gray-500">Últimos 7 días</p>
          <p class="text-2xl font-semibold text-gray-800">{{ activity.totals.last_7_days }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-3">
          <p class="text-xs text-gray-500">Últimos 30 días</p>
          <p class="text-2xl font-semibold text-gray-800">{{ activity.totals.last_30_days }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-3">
          <p class="text-xs text-gray-500">Últimos 90 días</p>
          <p class="text-2xl font-semibold text-gray-800">{{ activity.totals.last_90_days }}</p>
        </div>
      </div>

      <!-- Por día -->
      <div>
        <div class="flex items-baseline justify-between mb-2">
          <h4 class="text-sm font-semibold text-gray-700">Ingresos por día</h4>
          <span class="text-xs text-gray-500">
            {{ activeDays }} {{ activeDays === 1 ? 'día activo' : 'días activos' }} de 30
          </span>
        </div>
        <div class="flex items-end gap-[3px] h-20" role="img" aria-label="Ingresos por día, últimos 30 días">
          <div
            v-for="d in dailySeries"
            :key="d.day"
            v-tooltip.top="`${dayLabel(d.day)}: ${d.total}`"
            class="flex-1 rounded-t-sm"
            :class="d.total > 0 ? 'bg-primary' : 'bg-gray-100'"
            :style="{ height: d.total > 0 ? `${Math.max(8, (d.total / dailyMax) * 100)}%` : '4px' }"
          />
        </div>
        <div class="flex justify-between text-[11px] text-gray-400 mt-1">
          <span>{{ dayLabel(dailySeries[0].day) }}</span>
          <span>Hoy</span>
        </div>
      </div>

      <!-- Por canal -->
      <div v-if="activity.by_channel.length" class="flex flex-wrap gap-2">
        <span
          v-for="c in activity.by_channel"
          :key="c.channel"
          class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
        >
          {{ channelLabel(c.channel) }}
          <strong>{{ c.total }}</strong>
        </span>
        <span class="text-xs text-gray-400 self-center">(90 días)</span>
      </div>

      <!-- Últimos ingresos -->
      <div>
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Últimos ingresos</h4>
        <p v-if="!activity.recent.length" class="text-sm text-gray-500">
          Sin ingresos registrados todavía.
        </p>
        <div v-else class="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 sticky top-0">
              <tr>
                <th class="text-left font-medium px-3 py-2">Fecha</th>
                <th class="text-left font-medium px-3 py-2">Canal</th>
                <th class="text-left font-medium px-3 py-2">Dispositivo</th>
                <th class="text-left font-medium px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in activity.recent" :key="i" class="border-t border-gray-100">
                <td class="px-3 py-2 text-gray-700 whitespace-nowrap">{{ formatDateTime(e.created_at) }}</td>
                <td class="px-3 py-2 text-gray-600">{{ channelLabel(e.channel) }}</td>
                <td class="px-3 py-2 text-gray-600">{{ deviceLabel(e.user_agent) }}</td>
                <td class="px-3 py-2 text-gray-500 font-mono text-xs">{{ e.ip || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-gray-400">
        El registro de ingresos es reciente: la actividad anterior a su activación no aparece.
      </p>
    </div>
  </Dialog>
</template>
