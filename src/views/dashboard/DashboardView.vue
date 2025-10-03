<template>
  <div>
    <!-- Header con título y selector de período -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Dashboard</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ authStore.selectedStore?.name }}
        </p>
      </div>
      <PeriodSelector v-model="dashboardStore.period" @update:model-value="dashboardStore.setPeriod" />
    </div>

    <!-- Loading state -->
    <div v-if="dashboardStore.isLoading" class="flex justify-center items-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error state -->
    <Message v-else-if="dashboardStore.error" severity="error" :closable="false">
      {{ dashboardStore.error }}
    </Message>

    <!-- Dashboard content -->
    <div v-else-if="dashboardStore.metrics" class="space-y-6">
      <!-- Métricas principales (Scorecards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Ventas -->
        <MetricsCard
          title="Ventas"
          :value="formatCurrency(dashboardStore.metrics.sales.amount)"
          :subtitle="`${dashboardStore.metrics.sales.orders_count} pedidos`"
          :change="{
            value: dashboardStore.metrics.sales.change.value,
            percentage: dashboardStore.metrics.sales.change.percentage,
            isPositive: dashboardStore.metrics.sales.change.isPositive
          }"
          icon="pi-shopping-cart"
          icon-color="primary"
        />

        <!-- Ticket Promedio -->
        <MetricsCard
          title="Ticket Promedio"
          :value="formatCurrency(dashboardStore.metrics.average_ticket.amount)"
          :change="{
            value: dashboardStore.metrics.average_ticket.change.value,
            percentage: dashboardStore.metrics.average_ticket.change.percentage,
            isPositive: dashboardStore.metrics.average_ticket.change.isPositive
          }"
          icon="pi-chart-line"
          icon-color="success"
        />

        <!-- Productos Publicados -->
        <MetricsCard
          title="Productos Publicados"
          :value="`${dashboardStore.metrics.products.published} / ${dashboardStore.metrics.products.total}`"
          :subtitle="`${dashboardStore.metrics.products.percentage}% del total`"
          icon="pi-box"
          icon-color="info"
        />

        <!-- Productos Agotados -->
        <MetricsCard
          title="Productos Agotados"
          :value="`${dashboardStore.metrics.stock.out_of_stock}`"
          :subtitle="`${dashboardStore.metrics.stock.percentage}% de publicados`"
          icon="pi-exclamation-triangle"
          icon-color="warning"
        />
      </div>

      <!-- Pedidos Recientes -->
      <RecentOrders :orders="dashboardStore.metrics.recent_orders" />
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-chart-bar text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay datos disponibles</h3>
      <p class="text-secondary-500">
        No se encontraron métricas para el período seleccionado
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboardStore } from '@/stores/dashboard.store'
import { useFormatters } from '@/composables/useFormatters'
import Message from 'primevue/message'
import MetricsCard from '@/components/dashboard/MetricsCard.vue'
import PeriodSelector from '@/components/dashboard/PeriodSelector.vue'
import RecentOrders from '@/components/dashboard/RecentOrders.vue'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const { formatCurrency } = useFormatters()

onMounted(() => {
  dashboardStore.fetchMetrics()
})
</script>
