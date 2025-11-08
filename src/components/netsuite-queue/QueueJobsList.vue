<script setup lang="ts">
import { computed } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import type { QueueJob, FailedJob } from '@/types/netsuite-queue.types'

interface Props {
  jobs?: QueueJob[]
  failedJobs?: FailedJob[]
  isLoading?: boolean
  showFailedJobs?: boolean
  error?: string | null
}

interface Emits {
  (e: 'retry', jobId: number): void
  (e: 'delete', jobId: number): void
  (e: 'view-details', job: QueueJob | FailedJob): void
}

const props = withDefaults(defineProps<Props>(), {
  jobs: () => [],
  failedJobs: () => [],
  isLoading: false,
  showFailedJobs: false,
  error: null
})

const emit = defineEmits<Emits>()
const confirm = useConfirm()

const displayJobs = computed(() => {
  if (props.showFailedJobs) {
    return props.failedJobs
  }
  return props.jobs
})

const hasJobs = computed(() => displayJobs.value.length > 0)

function getStatusSeverity(job: QueueJob | FailedJob): 'success' | 'info' | 'warning' | 'danger' {
  if ('failed_at' in job) return 'danger'
  if ('reserved_at_human' in job && job.reserved_at_human) return 'info'
  return 'warning'
}

function getStatusLabel(job: QueueJob | FailedJob): string {
  if ('failed_at' in job) return 'Fallido'
  if ('reserved_at_human' in job && job.reserved_at_human) return 'En Proceso'
  return 'Pendiente'
}

function getAttemptsSeverity(attempts: number, maxAttempts: number): 'success' | 'warning' | 'danger' {
  const ratio = attempts / maxAttempts
  if (ratio >= 0.8) return 'danger'
  if (ratio >= 0.5) return 'warning'
  return 'success'
}

function formatAge(ageSeconds: number): string {
  if (ageSeconds < 60) return `${ageSeconds}s`
  const minutes = Math.floor(ageSeconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function handleRetry(job: QueueJob | FailedJob) {
  confirm.require({
    message: `¿Estás seguro de reintentar este trabajo?`,
    header: 'Confirmar Reintento',
    icon: 'pi pi-refresh',
    acceptLabel: 'Sí, reintentar',
    rejectLabel: 'Cancelar',
    accept: () => {
      emit('retry', job.id)
    }
  })
}

function handleDelete(job: QueueJob | FailedJob) {
  const isFailedJob = 'failed_at' in job
  confirm.require({
    message: `¿Estás seguro de eliminar este trabajo ${isFailedJob ? 'fallido' : ''}? Esta acción no se puede deshacer.`,
    header: 'Confirmar Eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => {
      emit('delete', job.id)
    }
  })
}

function handleViewDetails(job: QueueJob | FailedJob) {
  emit('view-details', job)
}

function truncateException(exception: string, maxLength = 100): string {
  if (exception.length <= maxLength) return exception
  return exception.substring(0, maxLength) + '...'
}
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <span>{{ showFailedJobs ? 'Trabajos Fallidos' : 'Cola de Trabajos' }}</span>
        <span v-if="!isLoading" class="text-sm font-normal text-gray-600">
          {{ displayJobs.length }} trabajo{{ displayJobs.length !== 1 ? 's' : '' }}
        </span>
      </div>
    </template>

    <template #content>
      <!-- Error State -->
      <div v-if="error" class="mb-4">
        <Message severity="error" :closable="false">
          {{ error }}
        </Message>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasJobs && !error" class="text-center py-12">
        <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">
          {{ showFailedJobs ? 'No hay trabajos fallidos' : 'No hay trabajos en la cola' }}
        </p>
      </div>

      <!-- DataTable -->
      <DataTable
        v-else
        :value="displayJobs"
        :paginator="displayJobs.length > 10"
        :rows="10"
        :rows-per-page-options="[10, 20, 50]"
        striped-rows
        responsive-layout="scroll"
        class="mt-4"
      >
        <Column field="id" header="ID" :sortable="true" style="width: 80px">
          <template #body="{ data }">
            <span class="font-mono text-sm">{{ data.id }}</span>
          </template>
        </Column>

        <Column field="queue" header="Cola" :sortable="true">
          <template #body="{ data }">
            <Tag :value="data.queue" severity="info" />
          </template>
        </Column>

        <Column header="Estado">
          <template #body="{ data }">
            <Tag :value="getStatusLabel(data)" :severity="getStatusSeverity(data)" />
          </template>
        </Column>

        <Column v-if="!showFailedJobs" field="order_id" header="Orden" :sortable="true">
          <template #body="{ data }">
            <span v-if="data.order_id" class="font-mono">{{ data.order_id }}</span>
            <span v-else class="text-gray-400">-</span>
          </template>
        </Column>

        <Column v-if="!showFailedJobs" header="Intentos">
          <template #body="{ data }">
            <Tag
              :value="`${data.attempts}/${data.max_attempts}`"
              :severity="getAttemptsSeverity(data.attempts, data.max_attempts)"
            />
          </template>
        </Column>

        <Column v-if="!showFailedJobs" field="age_seconds" header="Antigüedad" :sortable="true">
          <template #body="{ data }">
            <span class="text-sm">{{ formatAge(data.age_seconds) }}</span>
          </template>
        </Column>

        <Column v-if="!showFailedJobs" field="created_at_human" header="Creado" :sortable="true">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.created_at_human }}</span>
          </template>
        </Column>

        <Column v-if="showFailedJobs" field="failed_at" header="Falló el" :sortable="true">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">{{ data.failed_at }}</span>
          </template>
        </Column>

        <Column v-if="showFailedJobs" field="exception_short" header="Error">
          <template #body="{ data }">
            <div class="text-sm text-red-600 max-w-md">
              {{ truncateException(data.exception_short) }}
            </div>
          </template>
        </Column>

        <Column header="Acciones" style="width: 200px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-eye"
                severity="info"
                size="small"
                text
                rounded
                v-tooltip.top="'Ver detalles'"
                @click="handleViewDetails(data)"
              />
              <Button
                v-if="showFailedJobs"
                icon="pi pi-refresh"
                severity="success"
                size="small"
                text
                rounded
                v-tooltip.top="'Reintentar'"
                @click="handleRetry(data)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                size="small"
                text
                rounded
                v-tooltip.top="'Eliminar'"
                @click="handleDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>
