<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import ScrollPanel from 'primevue/scrollpanel'
import type { QueueJob, FailedJob } from '@/types/netsuite-queue.types'

interface Props {
  job: QueueJob | FailedJob | null
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'retry', jobId: number): void
  (e: 'delete', jobId: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isFailedJob = computed(() => {
  return props.job && 'failed_at' in props.job
})

const payloadString = computed(() => {
  if (!props.job?.payload) return 'No hay datos de payload'
  return JSON.stringify(props.job.payload, null, 2)
})

const exceptionString = computed(() => {
  if (!props.job || !isFailedJob.value) return null
  const failedJob = props.job as FailedJob
  return failedJob.exception || failedJob.exception_short
})

function handleClose() {
  emit('update:visible', false)
}

function handleRetry() {
  if (props.job) {
    emit('retry', props.job.id)
    handleClose()
  }
}

function handleDelete() {
  if (props.job) {
    emit('delete', props.job.id)
    handleClose()
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Detalles del Trabajo #${job?.id || ''}`"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    @update:visible="handleClose"
  >
    <div v-if="job" class="space-y-4">
      <!-- Basic Info -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <div class="font-mono text-lg">{{ job.id }}</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Cola</label>
          <Tag :value="job.queue" severity="info" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tienda ID</label>
          <div class="font-mono">{{ job.tienda_id }}</div>
        </div>

        <div v-if="job.order_id">
          <label class="block text-sm font-medium text-gray-700 mb-1">Orden ID</label>
          <div class="font-mono">{{ job.order_id }}</div>
        </div>

        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Clase del Trabajo</label>
          <div class="font-mono text-sm bg-gray-100 p-2 rounded">{{ job.job_class }}</div>
        </div>
      </div>

      <Divider />

      <!-- Status Info -->
      <div v-if="!isFailedJob" class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Intentos</label>
          <div>
            <Tag
              :value="`${(job as QueueJob).attempts}/${(job as QueueJob).max_attempts}`"
              :severity="
                (job as QueueJob).attempts >= (job as QueueJob).max_attempts ? 'danger' : 'success'
              "
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Antigüedad</label>
          <div>{{ (job as QueueJob).age_seconds }} segundos</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Creado</label>
          <div class="text-sm">{{ (job as QueueJob).created_at_human }}</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Disponible desde</label>
          <div class="text-sm">{{ (job as QueueJob).available_at_human }}</div>
        </div>

        <div v-if="(job as QueueJob).reserved_at_human" class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Reservado en</label>
          <div class="text-sm">{{ (job as QueueJob).reserved_at_human }}</div>
        </div>
      </div>

      <!-- Failed Job Info -->
      <div v-else>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Falló el</label>
          <div class="text-sm text-red-600">{{ (job as FailedJob).failed_at }}</div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Error</label>
          <div class="relative">
            <ScrollPanel style="width: 100%; height: 200px" class="custom-scrollpanel">
              <pre
                class="text-xs bg-red-50 border border-red-200 p-3 rounded text-red-800 whitespace-pre-wrap"
              >{{ exceptionString }}</pre>
            </ScrollPanel>
            <Button
              icon="pi pi-copy"
              severity="secondary"
              size="small"
              text
              rounded
              class="absolute top-2 right-2"
              v-tooltip.top="'Copiar error'"
              @click="copyToClipboard(exceptionString || '')"
            />
          </div>
        </div>
      </div>

      <Divider />

      <!-- Payload -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">Payload</label>
          <Button
            icon="pi pi-copy"
            severity="secondary"
            size="small"
            text
            label="Copiar"
            @click="copyToClipboard(payloadString)"
          />
        </div>
        <ScrollPanel style="width: 100%; height: 300px" class="custom-scrollpanel">
          <pre class="text-xs bg-gray-100 p-3 rounded font-mono">{{ payloadString }}</pre>
        </ScrollPanel>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <div>
          <Button
            v-if="isFailedJob"
            label="Reintentar"
            icon="pi pi-refresh"
            severity="success"
            @click="handleRetry"
          />
        </div>
        <div class="flex gap-2">
          <Button
            label="Eliminar"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="handleDelete"
          />
          <Button label="Cerrar" severity="secondary" @click="handleClose" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.custom-scrollpanel :deep(.p-scrollpanel-wrapper) {
  border-right: 9px solid var(--surface-ground);
}

.custom-scrollpanel :deep(.p-scrollpanel-bar) {
  background-color: var(--primary-color);
  opacity: 1;
  transition: background-color 0.2s;
}

.custom-scrollpanel :deep(.p-scrollpanel-bar:hover) {
  background-color: var(--primary-700);
}
</style>
