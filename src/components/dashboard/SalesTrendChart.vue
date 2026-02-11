<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Ventas Netas Diarias</h3>
    <div v-if="data.length === 0" class="flex items-center justify-center h-64 text-secondary-400">
      Sin datos para el periodo seleccionado
    </div>
    <v-chart v-else :option="chartOption" :autoresize="true" style="height: 300px" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { TrendPoint } from '@/types/dashboard.types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

interface Props {
  data: TrendPoint[]
}

const props = defineProps<Props>()

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter(params: any) {
      const p = params[0]
      const date = p.axisValue
      const net = Number(p.data).toLocaleString('es-PE', {
        style: 'currency',
        currency: 'PEN'
      })
      const orders = props.data[p.dataIndex]?.orders ?? 0
      return `<strong>${date}</strong><br/>Ventas Netas: ${net}<br/>Pedidos: ${orders}`
    }
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: props.data.map(d => {
      const date = new Date(d.date + 'T00:00:00')
      return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    }),
    axisLabel: { rotate: props.data.length > 15 ? 45 : 0, fontSize: 11 }
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
      name: 'Ventas Netas',
      type: 'line',
      smooth: true,
      data: props.data.map(d => d.net),
      lineStyle: { color: '#00b2a6', width: 2 },
      itemStyle: { color: '#00b2a6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 178, 166, 0.3)' },
            { offset: 1, color: 'rgba(0, 178, 166, 0.02)' }
          ]
        }
      }
    }
  ]
}))
</script>
