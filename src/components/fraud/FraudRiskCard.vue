<template>
  <Card class="fraud-risk-card">
    <template #header>
      <div class="flex items-center justify-between p-4 border-b border-secondary-200">
        <div class="flex items-center gap-3">
          <i class="pi pi-shield text-2xl text-secondary-600"></i>
          <div>
            <h3 class="text-lg font-semibold text-secondary-800">
              Calificación de riesgo del cliente
            </h3>
            <p class="text-sm text-secondary-500">
              Análisis de patrones de fraude cross-platform
            </p>
          </div>
        </div>

        <!-- Confirmed Fraud Badge -->
        <Badge
          v-if="analysis?.is_confirmed_fraud"
          value="FRAUDE CONFIRMADO"
          severity="danger"
          class="text-sm font-bold"
        />
      </div>
    </template>

    <template #content>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p class="mt-4 text-sm text-secondary-500">Analizando patrones de riesgo...</p>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-8 text-center"
      >
        <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-3"></i>
        <p class="text-sm text-secondary-700 mb-2">Error al cargar análisis de riesgo</p>
        <p class="text-xs text-secondary-500 mb-4">{{ error }}</p>
        <Button
          label="Reintentar"
          icon="pi pi-refresh"
          size="small"
          outlined
          @click="loadAnalysis"
        />
      </div>

      <!-- Analysis Content -->
      <div v-else-if="analysis" class="space-y-6">
        <!-- Overall Risk Score -->
        <div class="risk-score-container">
          <div class="text-center mb-4">
            <div class="text-sm font-medium text-secondary-600 mb-2">
              Puntuación de riesgo general
            </div>
            <div class="flex items-center justify-center gap-4">
              <div
                class="text-5xl font-bold"
                :class="overallRiskColor"
              >
                {{ analysis.overall_risk_score }}
              </div>
              <div class="text-left">
                <Badge
                  :value="overallRiskLabel"
                  :severity="overallRiskSeverity"
                  class="text-sm font-semibold"
                />
                <p class="text-xs text-secondary-500 mt-1">
                  de 100 puntos
                </p>
              </div>
            </div>
          </div>

          <!-- Risk Level Indicator Bar -->
          <div class="w-full bg-secondary-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-full transition-all duration-500 ease-out"
              :class="overallRiskBarColor"
              :style="{ width: `${analysis.overall_risk_score}%` }"
            ></div>
          </div>
        </div>

        <Divider />

        <!-- Metrics List -->
        <div class="space-y-1">
          <h4 class="text-sm font-semibold text-secondary-700 mb-3">
            Métricas de riesgo detectadas
          </h4>

          <RiskIndicator
            v-for="metric in sortedMetrics"
            :key="metric.metric"
            :label="getMetricLabel(metric.metric)"
            :risk-level="metric.risk_level"
            :count="metric.suspicious_count"
            :description="metric.description"
          />
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4 border-t border-secondary-200">
          <Button
            label="Actualizar análisis"
            icon="pi pi-refresh"
            size="small"
            outlined
            :loading="isRefreshing"
            @click="refreshAnalysis"
          />
        </div>

        <!-- Last Updated -->
        <div class="text-xs text-secondary-400 text-center">
          Última actualización: {{ formattedLastUpdate }}
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useFraudAnalysisStore } from '@/stores/fraud-analysis.store'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import RiskIndicator from './RiskIndicator.vue'

export interface FraudRiskCardProps {
  orderId: number
}

const props = defineProps<FraudRiskCardProps>()

const fraudStore = useFraudAnalysisStore()

const isLoading = ref(false)
const isRefreshing = ref(false)
const error = ref<string | null>(null)

const analysis = computed(() => fraudStore.analysis)

// Overall risk level calculations
const overallRiskLevel = computed(() => {
  if (!analysis.value) return 'low'
  const score = analysis.value.overall_risk_score
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
})

const overallRiskLabel = computed(() => {
  switch (overallRiskLevel.value) {
    case 'high':
      return 'RIESGO ALTO'
    case 'medium':
      return 'RIESGO MEDIO'
    case 'low':
      return 'RIESGO BAJO'
    default:
      return 'DESCONOCIDO'
  }
})

const overallRiskSeverity = computed(() => {
  switch (overallRiskLevel.value) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'info'
  }
})

const overallRiskColor = computed(() => {
  switch (overallRiskLevel.value) {
    case 'high':
      return 'text-red-600'
    case 'medium':
      return 'text-yellow-600'
    case 'low':
      return 'text-green-600'
    default:
      return 'text-secondary-600'
  }
})

const overallRiskBarColor = computed(() => {
  switch (overallRiskLevel.value) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-secondary-500'
  }
})

// Sort metrics by risk level (high first) and then by suspicious count
const sortedMetrics = computed(() => {
  if (!analysis.value?.metrics) return []

  const riskOrder = { high: 0, medium: 1, low: 2 }

  return [...analysis.value.metrics].sort((a, b) => {
    // First by risk level
    const riskDiff = riskOrder[a.risk_level] - riskOrder[b.risk_level]
    if (riskDiff !== 0) return riskDiff

    // Then by suspicious count (descending)
    return (b.suspicious_count || 0) - (a.suspicious_count || 0)
  })
})

const formattedLastUpdate = computed(() => {
  if (!analysis.value?.analyzed_at) return 'Desconocido'

  return formatDistanceToNow(new Date(analysis.value.analyzed_at), {
    addSuffix: true,
    locale: es,
  })
})

// Metric labels mapping
const metricLabels: Record<string, string> = {
  shipping_address: 'Dirección de envío',
  customer_name: 'Nombre del cliente',
  document_number: 'Número de documento',
  email_address: 'Correo electrónico',
  phone_number: 'Número de teléfono',
  ip_address: 'Dirección IP',
  time_pattern: 'Patrón temporal',
  amount_vs_average: 'Monto vs. promedio',
  device_fingerprint: 'Huella digital del dispositivo',
}

function getMetricLabel(metric: string): string {
  return metricLabels[metric] || metric
}

async function loadAnalysis() {
  isLoading.value = true
  error.value = null

  try {
    await fraudStore.fetchAnalysis(props.orderId)
  } catch (err: any) {
    error.value = err.message || 'Error al cargar el análisis'
    console.error('Error loading fraud analysis:', err)
  } finally {
    isLoading.value = false
  }
}

async function refreshAnalysis() {
  isRefreshing.value = true
  error.value = null

  try {
    await fraudStore.refreshAnalysis(props.orderId)
  } catch (err: any) {
    error.value = err.message || 'Error al actualizar el análisis'
    console.error('Error refreshing fraud analysis:', err)
  } finally {
    isRefreshing.value = false
  }
}

onMounted(() => {
  loadAnalysis()
})
</script>

<style scoped>
.fraud-risk-card {
  @apply shadow-sm;
}

.risk-score-container {
  @apply bg-secondary-50 rounded-lg p-6;
}
</style>
