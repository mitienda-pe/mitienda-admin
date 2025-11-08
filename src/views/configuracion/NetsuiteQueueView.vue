<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useNetsuiteQueueStore } from '@/stores/netsuite-queue.store'
import QueueStats from '@/components/netsuite-queue/QueueStats.vue'
import QueueFilters from '@/components/netsuite-queue/QueueFilters.vue'
import QueueJobsList from '@/components/netsuite-queue/QueueJobsList.vue'
import QueueJobDetail from '@/components/netsuite-queue/QueueJobDetail.vue'
import type { QueueJob, FailedJob } from '@/types/netsuite-queue.types'

const queueStore = useNetsuiteQueueStore()
const confirm = useConfirm()
const toast = useToast()

// Local State
const activeTab = ref(0) // 0 = Active Jobs, 1 = Failed Jobs
const selectedJob = ref<QueueJob | FailedJob | null>(null)
const showJobDetail = ref(false)
const autoRefreshEnabled = ref(false)
const refreshIntervalSeconds = ref(30)

// Computed
const showActiveJobs = computed(() => activeTab.value === 0)
const showFailedJobs = computed(() => activeTab.value === 1)

// Load initial data
onMounted(async () => {
  console.log('[NetsuiteQueueView] Component mounted')
  await loadAllData()
})

// Cleanup on unmount
onUnmounted(() => {
  queueStore.stopAutoRefresh()
})

async function loadAllData() {
  try {
    await queueStore.refreshAll()
  } catch (error: any) {
    console.error('[NetsuiteQueueView] Error loading data:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los datos de la cola',
      life: 5000
    })
  }
}

async function handleRefresh() {
  console.log('[NetsuiteQueueView] Manual refresh')
  await loadAllData()
  toast.add({
    severity: 'success',
    summary: 'Actualizado',
    detail: 'Datos actualizados correctamente',
    life: 3000
  })
}

async function handleFiltersUpdate() {
  console.log('[NetsuiteQueueView] Filters updated')
  await queueStore.fetchQueueJobs()
}

function handleViewDetails(job: QueueJob | FailedJob) {
  console.log('[NetsuiteQueueView] View details:', job.id)
  selectedJob.value = job
  showJobDetail.value = true
}

async function handleRetryJob(jobId: number) {
  try {
    console.log('[NetsuiteQueueView] Retry job:', jobId)
    await queueStore.retryFailedJob(jobId)
    toast.add({
      severity: 'success',
      summary: 'Trabajo Reintentado',
      detail: `El trabajo #${jobId} ha sido movido a la cola para reintento`,
      life: 5000
    })
  } catch (error: any) {
    console.error('[NetsuiteQueueView] Error retrying job:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al reintentar el trabajo',
      life: 5000
    })
  }
}

async function handleDeleteJob(jobId: number) {
  try {
    console.log('[NetsuiteQueueView] Delete job:', jobId)
    if (showFailedJobs.value) {
      await queueStore.deleteFailedJob(jobId)
    } else {
      await queueStore.deleteQueueJob(jobId)
    }
    toast.add({
      severity: 'success',
      summary: 'Trabajo Eliminado',
      detail: `El trabajo #${jobId} ha sido eliminado`,
      life: 3000
    })
  } catch (error: any) {
    console.error('[NetsuiteQueueView] Error deleting job:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar el trabajo',
      life: 5000
    })
  }
}

async function executeRetryAllFailed() {
  try {
    const count = await queueStore.retryAllFailedJobs()
    toast.add({
      severity: 'success',
      summary: 'Trabajos Reintentados',
      detail: `${count} trabajos han sido movidos a la cola para reintento`,
      life: 5000
    })
  } catch (error: any) {
    console.error('[NetsuiteQueueView] Error retrying all:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al reintentar trabajos',
      life: 5000
    })
  }
}

function handleRetryAllFailed() {
  confirm.require({
    message: `¿Estás seguro de reintentar TODOS los trabajos fallidos (${queueStore.failedJobsCount})? Esto puede generar mucha carga en el sistema.`,
    header: 'Confirmar Reintento Masivo',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, reintentar todos',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-warning',
    accept: () => {
      executeRetryAllFailed()
    }
  })
}

async function executeClearAllFailed() {
  try {
    const count = await queueStore.clearAllFailedJobs()
    toast.add({
      severity: 'success',
      summary: 'Trabajos Eliminados',
      detail: `${count} trabajos fallidos han sido eliminados permanentemente`,
      life: 5000
    })
  } catch (error: any) {
    console.error('[NetsuiteQueueView] Error clearing all:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al eliminar trabajos',
      life: 5000
    })
  }
}

function handleClearAllFailed() {
  confirm.require({
    message: `¿Estás seguro de eliminar permanentemente TODOS los trabajos fallidos (${queueStore.failedJobsCount})? Esta acción NO se puede deshacer.`,
    header: 'Confirmar Eliminación Masiva',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar todos',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      executeClearAllFailed()
    }
  })
}

function toggleAutoRefresh() {
  autoRefreshEnabled.value = !autoRefreshEnabled.value

  if (autoRefreshEnabled.value) {
    queueStore.startAutoRefresh(refreshIntervalSeconds.value)
    toast.add({
      severity: 'info',
      summary: 'Auto-actualización Activada',
      detail: `Se actualizará cada ${refreshIntervalSeconds.value} segundos`,
      life: 3000
    })
  } else {
    queueStore.stopAutoRefresh()
    toast.add({
      severity: 'info',
      summary: 'Auto-actualización Desactivada',
      detail: 'Ya no se actualizará automáticamente',
      life: 3000
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Cola NetSuite</h1>
        <p class="text-gray-600 mt-1">
          Monitorea y gestiona los trabajos de sincronización con NetSuite
        </p>
      </div>

      <div class="flex gap-2">
        <!-- Auto-refresh Toggle -->
        <Button
          :label="autoRefreshEnabled ? 'Auto-actualización ON' : 'Auto-actualización OFF'"
          :icon="autoRefreshEnabled ? 'pi pi-pause' : 'pi pi-play'"
          :severity="autoRefreshEnabled ? 'success' : 'secondary'"
          @click="toggleAutoRefresh"
        />

        <!-- Manual Refresh -->
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          severity="info"
          :loading="queueStore.isLoadingStats"
          @click="handleRefresh"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <QueueStats :stats="queueStore.stats" :is-loading="queueStore.isLoadingStats" />

    <!-- Filters -->
    <QueueFilters
      v-model="queueStore.filters"
      @update:model-value="handleFiltersUpdate"
      @refresh="handleRefresh"
    />

    <!-- Tabs -->
    <Card>
      <template #content>
        <TabView v-model:active-index="activeTab" @tab-change="handleFiltersUpdate">
          <!-- Active Jobs Tab -->
          <TabPanel>
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-list"></i>
                <span>Trabajos Activos</span>
                <Tag
                  v-if="queueStore.jobsCount > 0"
                  :value="String(queueStore.jobsCount)"
                  severity="info"
                />
              </div>
            </template>

            <div class="pt-4">
              <QueueJobsList
                :jobs="queueStore.jobs"
                :is-loading="queueStore.isLoadingJobs"
                :show-failed-jobs="false"
                :error="queueStore.jobsError"
                @view-details="handleViewDetails"
                @delete="handleDeleteJob"
              />
            </div>
          </TabPanel>

          <!-- Failed Jobs Tab -->
          <TabPanel>
            <template #header>
              <div class="flex items-center gap-2">
                <i class="pi pi-times-circle"></i>
                <span>Trabajos Fallidos</span>
                <Tag
                  v-if="queueStore.failedJobsCount > 0"
                  :value="String(queueStore.failedJobsCount)"
                  severity="danger"
                />
              </div>
            </template>

            <div class="pt-4">
              <!-- Bulk Actions for Failed Jobs -->
              <div v-if="queueStore.hasFailedJobs" class="mb-4 flex gap-2">
                <Button
                  label="Reintentar Todos"
                  icon="pi pi-refresh"
                  severity="warning"
                  @click="handleRetryAllFailed"
                />
                <Button
                  label="Eliminar Todos"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  @click="handleClearAllFailed"
                />
              </div>

              <QueueJobsList
                :failed-jobs="queueStore.failedJobs"
                :is-loading="queueStore.isLoadingFailedJobs"
                :show-failed-jobs="true"
                :error="queueStore.failedJobsError"
                @view-details="handleViewDetails"
                @retry="handleRetryJob"
                @delete="handleDeleteJob"
              />
            </div>
          </TabPanel>
        </TabView>
      </template>
    </Card>

    <!-- Job Detail Modal -->
    <QueueJobDetail
      v-model:visible="showJobDetail"
      :job="selectedJob"
      @retry="handleRetryJob"
      @delete="handleDeleteJob"
    />

    <!-- Confirm Dialog -->
    <ConfirmDialog />

    <!-- Toast -->
    <Toast />
  </div>
</template>
