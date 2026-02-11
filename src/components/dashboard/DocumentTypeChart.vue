<template>
  <div class="bg-white rounded-lg shadow-sm p-4">
    <h3 class="text-lg font-semibold text-secondary mb-4">Tipo de Comprobante</h3>
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
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { DistributionItem } from '@/types/dashboard.types'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

interface Props {
  data: DistributionItem[]
}

const props = defineProps<Props>()

const COLORS = ['#0ea5e9', '#8b5cf6', '#94a3b8']

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} pedidos ({d}%)'
  },
  legend: {
    orient: 'vertical',
    right: 10,
    top: 'center',
    textStyle: { fontSize: 12 }
  },
  series: [
    {
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: props.data.map((d, i) => ({
        name: d.name,
        value: d.count,
        itemStyle: { color: COLORS[i % COLORS.length] }
      }))
    }
  ]
}))
</script>
