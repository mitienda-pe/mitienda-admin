<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-secondary-900">Analítica Web</h1>
        <p class="text-secondary-600 mt-1">
          Tráfico y comportamiento de visitantes en tu tienda
          <span v-if="activeVisitors > 0" class="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {{ activeVisitors }} en línea
          </span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <Dropdown
          v-model="selectedPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
        />
      </div>
    </div>

    <!-- Not configured -->
    <div v-if="notConfigured" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-chart-line text-5xl text-gray-300 mb-4 block"></i>
      <h3 class="text-lg font-semibold text-gray-700 mb-2">Analítica web no configurada</h3>
      <p class="text-gray-500">Contacta al equipo de soporte para activar la analítica web en tu tienda.</p>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex justify-center items-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white rounded-xl border border-red-200 p-8 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3 block"></i>
      <p class="text-red-600 mb-4">{{ error }}</p>
      <button @click="fetchData" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90">Reintentar</button>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 mb-1">Visitantes</p>
          <p class="text-2xl font-bold text-secondary-900">{{ formatNumber(stats?.visitors?.value) }}</p>
          <p class="text-xs mt-1" :class="getChangeClass(stats?.visitors)">
            <i :class="getChangeIcon(stats?.visitors)" class="text-[10px]"></i>
            {{ getChangeText(stats?.visitors) }}
          </p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 mb-1">Páginas vistas</p>
          <p class="text-2xl font-bold text-secondary-900">{{ formatNumber(stats?.pageviews?.value) }}</p>
          <p class="text-xs mt-1" :class="getChangeClass(stats?.pageviews)">
            <i :class="getChangeIcon(stats?.pageviews)" class="text-[10px]"></i>
            {{ getChangeText(stats?.pageviews) }}
          </p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 mb-1">Tasa de rebote</p>
          <p class="text-2xl font-bold text-secondary-900">{{ bounceRate }}%</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 mb-1">Tiempo promedio</p>
          <p class="text-2xl font-bold text-secondary-900">{{ avgTime }}</p>
        </div>
      </div>

      <!-- Visitors Chart -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Visitantes y páginas vistas</h3>
        <div v-if="pageviewsChartData.length" style="height: 300px">
          <v-chart :option="chartOption" :autoresize="true" style="height: 300px" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400">
          Sin datos para el período seleccionado
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Pages -->
        <MetricsCard title="Páginas más visitadas" :items="topPages" :format-label="formatPageUrl" />

        <!-- Referrers -->
        <MetricsCard title="Fuentes de tráfico" :items="referrers" :format-label="formatReferrer" />

        <!-- Browsers -->
        <MetricsCard title="Navegadores" :items="browsers" />

        <!-- Devices -->
        <MetricsCard title="Dispositivos" :items="devices" :format-label="formatDevice" />

        <!-- Countries -->
        <MetricsCard title="Países" :items="countries" />

        <!-- Events -->
        <MetricsCard title="Eventos" :items="events" :format-label="formatEvent" empty-text="Sin eventos registrados" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Dropdown from 'primevue/dropdown'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { webAnalyticsApi, type AnalyticsStats, type MetricItem } from '@/api/web-analytics.api'
import MetricsCard from '@/components/analytics/MetricsCard.vue'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const stats = ref<AnalyticsStats | null>(null)
const topPages = ref<MetricItem[]>([])
const referrers = ref<MetricItem[]>([])
const browsers = ref<MetricItem[]>([])
const devices = ref<MetricItem[]>([])
const countries = ref<MetricItem[]>([])
const events = ref<MetricItem[]>([])
const pageviewsChartData = ref<any[]>([])
const sessionsChartData = ref<any[]>([])
const chartLabels = ref<string[]>([])
const activeVisitors = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const notConfigured = ref(false)
let activeInterval: ReturnType<typeof setInterval> | null = null

const selectedPeriod = ref('30d')
const periodOptions = [
  { label: 'Hoy', value: 'today' },
  { label: 'Ayer', value: 'yesterday' },
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Últimos 90 días', value: '90d' }
]

function getDateRange(period: string) {
  const now = new Date()
  const endAt = now.getTime()
  let startAt: number
  let unit = 'day'

  switch (period) {
    case 'today':
      startAt = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      unit = 'hour'
      break
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      startAt = new Date(y.getFullYear(), y.getMonth(), y.getDate()).getTime()
      unit = 'hour'
      break
    }
    case '7d':
      startAt = endAt - 7 * 24 * 60 * 60 * 1000
      break
    case '90d':
      startAt = endAt - 90 * 24 * 60 * 60 * 1000
      unit = 'week'
      break
    default:
      startAt = endAt - 30 * 24 * 60 * 60 * 1000
  }

  return { startAt, endAt, unit }
}

const bounceRate = computed(() => {
  if (!stats.value?.visits?.value) return 0
  return Math.round((stats.value.bounces.value / stats.value.visits.value) * 100)
})

const avgTime = computed(() => {
  if (!stats.value?.visits?.value) return '0s'
  const seconds = Math.round(stats.value.totaltime.value / stats.value.visits.value)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
})

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter(params: any) {
      const date = params[0].axisValue
      const lines = params.map((p: any) => `${p.marker} ${p.seriesName}: <strong>${p.data}</strong>`)
      return `<strong>${date}</strong><br/>${lines.join('<br/>')}`
    }
  },
  legend: { bottom: 0, data: ['Visitantes', 'Páginas vistas'], textStyle: { fontSize: 12 } },
  grid: { left: '3%', right: '4%', bottom: '12%', top: '4%', containLabel: true },
  xAxis: {
    type: 'category',
    data: chartLabels.value,
    axisLabel: { rotate: chartLabels.value.length > 15 ? 45 : 0, fontSize: 11 }
  },
  yAxis: { type: 'value', axisLabel: { fontSize: 11 }, minInterval: 1 },
  series: [
    {
      name: 'Visitantes',
      type: 'line',
      smooth: true,
      data: sessionsChartData.value,
      lineStyle: { color: '#00b2a6', width: 2 },
      itemStyle: { color: '#00b2a6' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 178, 166, 0.3)' },
            { offset: 1, color: 'rgba(0, 178, 166, 0.02)' }
          ]
        }
      }
    },
    {
      name: 'Páginas vistas',
      type: 'line',
      smooth: true,
      data: pageviewsChartData.value,
      lineStyle: { color: '#6366f1', width: 2 },
      itemStyle: { color: '#6366f1' }
    }
  ]
}))

function formatNumber(n?: number): string {
  return (n || 0).toLocaleString('es-PE')
}

function getChangePercent(stat?: { value: number; prev: number }): number {
  if (!stat?.prev) return stat?.value ? 100 : 0
  return Math.round(((stat.value - stat.prev) / stat.prev) * 100)
}

function getChangeClass(stat?: { value: number; prev: number }): string {
  return getChangePercent(stat) >= 0 ? 'text-green-600' : 'text-red-600'
}

function getChangeIcon(stat?: { value: number; prev: number }): string {
  return getChangePercent(stat) >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
}

function getChangeText(stat?: { value: number; prev: number }): string {
  return `${Math.abs(getChangePercent(stat))}% vs período anterior`
}

function formatPageUrl(url: string): string {
  if (url === '/') return 'Inicio'
  return url.replace(/^\//, '').replace(/\//g, ' / ')
}

function formatReferrer(ref: string): string {
  if (!ref) return '(directo)'
  return ref.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function formatDevice(device: string): string {
  const map: Record<string, string> = { desktop: 'Escritorio', mobile: 'Móvil', tablet: 'Tablet' }
  return map[device] || device
}

function formatEvent(event: string): string {
  const map: Record<string, string> = {
    add_to_cart: 'Agregar al carrito',
    begin_checkout: 'Iniciar checkout',
    purchase: 'Compra completada',
    view_item: 'Ver producto',
    search: 'Búsqueda',
    add_to_wishlist: 'Agregar a favoritos'
  }
  return map[event] || event
}

async function fetchData() {
  loading.value = true
  error.value = null
  notConfigured.value = false

  const { startAt, endAt, unit } = getDateRange(selectedPeriod.value)

  try {
    const [statsRes, pageviewsRes, pagesRes, refsRes, browsersRes, devicesRes, countriesRes, eventsRes] =
      await Promise.all([
        webAnalyticsApi.getStats(startAt, endAt),
        webAnalyticsApi.getPageviews(startAt, endAt, unit),
        webAnalyticsApi.getMetrics(startAt, endAt, 'url'),
        webAnalyticsApi.getMetrics(startAt, endAt, 'referrer'),
        webAnalyticsApi.getMetrics(startAt, endAt, 'browser'),
        webAnalyticsApi.getMetrics(startAt, endAt, 'device'),
        webAnalyticsApi.getMetrics(startAt, endAt, 'country'),
        webAnalyticsApi.getMetrics(startAt, endAt, 'event')
      ])

    if (statsRes.data === null) {
      notConfigured.value = true
      loading.value = false
      return
    }

    stats.value = statsRes.data
    topPages.value = pagesRes.data || []
    referrers.value = refsRes.data || []
    browsers.value = browsersRes.data || []
    devices.value = devicesRes.data || []
    countries.value = countriesRes.data || []
    events.value = eventsRes.data || []

    if (pageviewsRes.data?.pageviews) {
      const pv = pageviewsRes.data.pageviews
      const sess = pageviewsRes.data.sessions
      chartLabels.value = pv.map((p: any) => {
        const d = new Date(p.x)
        if (unit === 'hour') return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
      })
      pageviewsChartData.value = pv.map((p: any) => p.y)
      sessionsChartData.value = sess.map((s: any) => s.y)
    } else {
      chartLabels.value = []
      pageviewsChartData.value = []
      sessionsChartData.value = []
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al cargar analítica web'
  } finally {
    loading.value = false
  }
}

async function fetchActive() {
  try {
    const res = await webAnalyticsApi.getActive()
    activeVisitors.value = res.data?.visitors ?? 0
  } catch { /* ignore */ }
}

onMounted(() => {
  fetchData()
  fetchActive()
  activeInterval = setInterval(fetchActive, 30000)
})

onUnmounted(() => {
  if (activeInterval) clearInterval(activeInterval)
})

watch(selectedPeriod, () => fetchData())
</script>
