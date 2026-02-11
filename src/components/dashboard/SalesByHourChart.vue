<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Ventas por Hora del Día</h3>
    <div v-if="data.length === 0" class="flex items-center justify-center h-64 text-secondary-400">
      Sin datos
    </div>
    <v-chart v-else :option="chartOption" :autoresize="true" style="height: 280px" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { HourDistribution } from '@/types/dashboard.types'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  data: HourDistribution[]
}

const props = defineProps<Props>()

// Fill all 24 hours (some may be missing from backend)
const fullHours = computed(() => {
  const map = new Map(props.data.map(d => [d.hour, d]))
  return Array.from({ length: 24 }, (_, i) => map.get(i) ?? { hour: i, count: 0, amount: 0 })
})

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter(params: any) {
      const p = params[0]
      const amount = Number(p.data).toLocaleString('es-PE', {
        style: 'currency',
        currency: 'PEN'
      })
      const item = fullHours.value[p.dataIndex]
      return `<strong>${p.axisValue}:00</strong><br/>Monto: ${amount}<br/>Pedidos: ${item?.count ?? 0}`
    }
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: fullHours.value.map(d => String(d.hour).padStart(2, '0')),
    axisLabel: { fontSize: 10 }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: (val: number) =>
        val >= 1000 ? `S/ ${(val / 1000).toFixed(0)}K` : `S/ ${val}`
    }
  },
  series: [
    {
      type: 'bar',
      data: fullHours.value.map(d => d.amount),
      itemStyle: { color: '#0ea5e9', borderRadius: [3, 3, 0, 0] },
      barMaxWidth: 20
    }
  ]
}))
</script>
