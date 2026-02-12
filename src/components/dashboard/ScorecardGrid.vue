<template>
  <div class="space-y-4">
    <!-- Row 1: Financial -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsCard
        title="Pedidos"
        :value="String(scorecards.orders_count.value)"
        :change="buildChange(scorecards.orders_count)"
        icon="pi-shopping-cart"
        icon-color="primary"
      />
      <MetricsCard
        title="Ventas Brutas"
        :value="formatCurrency(scorecards.gross_sales.value)"
        :change="buildChange(scorecards.gross_sales)"
        icon="pi-wallet"
        icon-color="info"
      />
      <MetricsCard
        title="IGV (18%)"
        :value="formatCurrency(scorecards.igv.value)"
        :change="buildChange(scorecards.igv)"
        icon="pi-percentage"
        icon-color="warning"
      />
      <MetricsCard
        title="Ventas Netas"
        :value="formatCurrency(scorecards.net_sales.value)"
        :change="buildChange(scorecards.net_sales)"
        icon="pi-chart-line"
        icon-color="success"
      />
    </div>

    <!-- Row 2: Tickets -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsCard
        title="Ticket Promedio"
        :value="formatCurrency(scorecards.avg_ticket.value)"
        :change="buildChange(scorecards.avg_ticket)"
        icon="pi-receipt"
        icon-color="primary"
      />
      <MetricsCard
        title="Ticket Más Alto"
        :value="formatCurrency(scorecards.max_ticket.value)"
        :change="buildChange(scorecards.max_ticket)"
        icon="pi-arrow-up"
        icon-color="success"
      />
      <MetricsCard
        title="Ticket Más Bajo"
        :value="formatCurrency(scorecards.min_ticket.value)"
        :change="buildChange(scorecards.min_ticket, true)"
        icon="pi-arrow-down"
        icon-color="danger"
      />
      <MetricsCard
        title="Items por Pedido"
        :value="String(scorecards.avg_items_per_order.value)"
        :change="buildChange(scorecards.avg_items_per_order)"
        icon="pi-box"
        icon-color="info"
      />
    </div>

    <!-- Row 3: Customers & Operations -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricsCard
        title="Clientes Nuevos"
        :value="String(scorecards.new_customers.value)"
        :change="buildChange(scorecards.new_customers)"
        icon="pi-user-plus"
        icon-color="success"
      />
      <MetricsCard
        title="Clientes Recurrentes"
        :value="String(scorecards.returning_customers.value)"
        :change="buildChange(scorecards.returning_customers)"
        icon="pi-users"
        icon-color="primary"
      />
      <MetricsCard
        title="% Recurrentes"
        :value="`${scorecards.returning_pct.value}%`"
        :change="buildChange(scorecards.returning_pct)"
        icon="pi-replay"
        icon-color="info"
      />
      <MetricsCard
        title="Tasa Rechazo"
        :value="`${scorecards.rejection_rate?.value ?? 0}%`"
        :change="buildChange(scorecards.rejection_rate, true)"
        icon="pi-times-circle"
        icon-color="danger"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MetricsCard from './MetricsCard.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { Scorecard, Scorecards } from '@/types/dashboard.types'

interface Props {
  scorecards: Scorecards
  showComparison: boolean
}

const props = defineProps<Props>()
const { formatCurrency } = useFormatters()

function buildChange(
  scorecard: Scorecard | undefined,
  invertPositive = false
): { value: number; percentage: number; isPositive: boolean } | undefined {
  if (!scorecard || !props.showComparison || scorecard.previous === undefined) return undefined

  const diff = scorecard.value - scorecard.previous
  const pct =
    scorecard.previous > 0
      ? Number(((diff / scorecard.previous) * 100).toFixed(1))
      : scorecard.value > 0
        ? 100
        : 0

  return {
    value: diff,
    percentage: pct,
    isPositive: invertPositive ? pct <= 0 : pct >= 0
  }
}
</script>
