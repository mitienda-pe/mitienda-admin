<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Ventas Netas Mensuales</h3>
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
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { TrendPoint } from '@/types/dashboard.types'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  data: TrendPoint[]
}

const props = defineProps<Props>()

const monthNames: Record<string, string> = {
  '01': 'Ene',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dic'
}

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter(params: any) {
      const p = params[0]
      const net = Number(p.data).toLocaleString('es-PE', {
        style: 'currency',
        currency: 'PEN'
      })
      const orders = props.data[p.dataIndex]?.orders ?? 0
      return `<strong>${p.axisValue}</strong><br/>Ventas Netas: ${net}<br/>Pedidos: ${orders}`
    }
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: props.data.map(d => {
      const parts = (d.month ?? '').split('-')
      return parts.length === 2 ? `${monthNames[parts[1]] ?? parts[1]} ${parts[0]}` : d.month
    })
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
      type: 'bar',
      data: props.data.map(d => d.net),
      itemStyle: {
        color: '#00b2a6',
        borderRadius: [4, 4, 0, 0]
      },
      barMaxWidth: 40
    }
  ]
}))
</script>
