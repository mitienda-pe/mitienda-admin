<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Dashboard</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ authStore.selectedStore?.name }}
          <span v-if="dashboardStore.analytics" class="ml-2 text-secondary-400">
            {{ formatDateRange(dashboardStore.filters.dateFrom, dashboardStore.filters.dateTo) }}
          </span>
        </p>
      </div>
      <DateRangeFilter
        :date-from="dashboardStore.filters.dateFrom"
        :date-to="dashboardStore.filters.dateTo"
        :compare-enabled="dashboardStore.filters.compare"
        @update:date-range="dashboardStore.setDateRange"
        @update:compare="onCompareToggle"
      />
    </div>

    <!-- Loading state -->
    <div v-if="dashboardStore.isLoading" class="flex justify-center items-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Error state -->
    <AppErrorState
      v-else-if="dashboardStore.error"
      :message="dashboardStore.error"
      @retry="dashboardStore.fetchAnalytics"
    />

    <!-- Dashboard content -->
    <div v-else-if="dashboardStore.hasData" class="space-y-8">
      <!-- Scorecards -->
      <section>
        <ScorecardGrid
          :scorecards="dashboardStore.scorecards!"
          :show-comparison="dashboardStore.filters.compare"
        />
      </section>

      <!-- Trends -->
      <section>
        <h2 class="text-xl font-semibold text-secondary mb-4">Tendencias de Ventas</h2>
        <div class="space-y-4">
          <SalesTrendChart :data="dashboardStore.trends?.daily_sales ?? []" />
          <MonthlySalesChart :data="dashboardStore.trends?.monthly_sales ?? []" />
        </div>
      </section>

      <!-- Distributions -->
      <section>
        <h2 class="text-xl font-semibold text-secondary mb-4">Distribuciones</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <PaymentMethodChart :data="dashboardStore.distributions?.payment_methods ?? []" />
          <ShippingTypeChart :data="dashboardStore.distributions?.shipping_types ?? []" />
          <DocumentTypeChart :data="dashboardStore.distributions?.document_types ?? []" />
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SalesByDayChart :data="dashboardStore.distributions?.by_day_of_week ?? []" />
          <SalesByHourChart :data="dashboardStore.distributions?.by_hour ?? []" />
        </div>
      </section>

      <!-- Rankings -->
      <section>
        <h2 class="text-xl font-semibold text-secondary mb-4">Rankings</h2>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <TopProductsTable :data="dashboardStore.topProducts" />
          <TopCustomersTable :data="dashboardStore.topCustomers" />
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-chart-bar text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay datos disponibles</h3>
      <p class="text-secondary-500">
        No se encontraron datos para el periodo seleccionado
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboardStore } from '@/stores/dashboard.store'
import { AppErrorState } from '@/components/ui'
import DateRangeFilter from '@/components/dashboard/DateRangeFilter.vue'
import ScorecardGrid from '@/components/dashboard/ScorecardGrid.vue'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart.vue'
import MonthlySalesChart from '@/components/dashboard/MonthlySalesChart.vue'
import PaymentMethodChart from '@/components/dashboard/PaymentMethodChart.vue'
import ShippingTypeChart from '@/components/dashboard/ShippingTypeChart.vue'
import DocumentTypeChart from '@/components/dashboard/DocumentTypeChart.vue'
import SalesByDayChart from '@/components/dashboard/SalesByDayChart.vue'
import SalesByHourChart from '@/components/dashboard/SalesByHourChart.vue'
import TopProductsTable from '@/components/dashboard/TopProductsTable.vue'
import TopCustomersTable from '@/components/dashboard/TopCustomersTable.vue'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

function onCompareToggle(val: boolean) {
  dashboardStore.setFilters({ compare: val })
}

function formatDateRange(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
  const fromDate = new Date(from + 'T00:00:00')
  const toDate = new Date(to + 'T00:00:00')
  return `${fromDate.toLocaleDateString('es-PE', opts)} - ${toDate.toLocaleDateString('es-PE', opts)}`
}

onMounted(() => {
  dashboardStore.fetchAnalytics()
})
</script>
