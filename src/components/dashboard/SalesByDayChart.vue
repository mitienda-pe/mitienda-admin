<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Ventas por Día de Semana</h3>
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
import type { DayDistribution } from '@/types/dashboard.types'

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

interface Props {
  data: DayDistribution[]
}

const props = defineProps<Props>()

// Reorder: Lunes first (day_number=2), Domingo last (day_number=1)
const orderedDays = computed(() => {
  const sorted = [...props.data].sort((a, b) => {
    const aIdx = a.day_number === 1 ? 8 : a.day_number
    const bIdx = b.day_number === 1 ? 8 : b.day_number
    return aIdx - bIdx
  })
  return sorted
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
      const item = orderedDays.value[p.dataIndex]
      return `<strong>${p.axisValue}</strong><br/>Monto: ${amount}<br/>Pedidos: ${item?.count ?? 0}`
    }
  },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: orderedDays.value.map(d => d.day.substring(0, 3))
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
      data: orderedDays.value.map(d => d.amount),
      itemStyle: { color: '#00b2a6', borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 40
    }
  ]
}))
</script>
