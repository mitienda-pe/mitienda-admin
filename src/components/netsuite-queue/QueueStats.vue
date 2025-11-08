<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { QueueStats as QueueStatsType } from '@/types/netsuite-queue.types'

interface Props {
  stats: QueueStatsType | null
  isLoading?: boolean
}

const props = defineProps<Props>()

const totalPending = computed(() => {
  if (!props.stats) return 0
  return props.stats.pending_jobs.reduce((sum, item) => sum + Number(item.count), 0)
})

const totalReserved = computed(() => {
  if (!props.stats) return 0
  return props.stats.reserved_jobs.reduce((sum, item) => sum + Number(item.count), 0)
})

const oldestJobAgeMinutes = computed(() => {
  if (!props.stats || !props.stats.oldest_pending_age_seconds) return null
  return Math.floor(props.stats.oldest_pending_age_seconds / 60)
})

const hasOldJobs = computed(() => {
  if (!oldestJobAgeMinutes.value) return false
  return oldestJobAgeMinutes.value > 5 // Alert if older than 5 minutes
})

const oldestJobClass = computed(() => {
  return hasOldJobs.value ? 'border-red-500 bg-red-50' : 'border-gray-200'
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Pending Jobs Card -->
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-500 text-sm font-medium mb-1">Trabajos Pendientes</div>
            <div v-if="isLoading" class="h-8 flex items-center">
              <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
            </div>
            <div v-else class="text-3xl font-bold text-blue-600">
              {{ totalPending }}
            </div>
          </div>
          <div class="bg-blue-100 p-3 rounded-lg">
            <i class="pi pi-clock text-2xl text-blue-600"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- Processing Jobs Card -->
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-500 text-sm font-medium mb-1">En Proceso</div>
            <div v-if="isLoading" class="h-8 flex items-center">
              <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
            </div>
            <div v-else class="text-3xl font-bold text-purple-600">
              {{ totalReserved }}
            </div>
          </div>
          <div class="bg-purple-100 p-3 rounded-lg">
            <i class="pi pi-spin pi-spinner text-2xl text-purple-600"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- Failed Jobs Card -->
    <Card>
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-500 text-sm font-medium mb-1">Trabajos Fallidos</div>
            <div v-if="isLoading" class="h-8 flex items-center">
              <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
            </div>
            <div v-else class="text-3xl font-bold text-red-600">
              {{ Number(stats?.failed_jobs_count || 0) }}
            </div>
          </div>
          <div class="bg-red-100 p-3 rounded-lg">
            <i class="pi pi-times-circle text-2xl text-red-600"></i>
          </div>
        </div>
      </template>
    </Card>

    <!-- Oldest Job Age Card -->
    <Card :class="oldestJobClass">
      <template #content>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-500 text-sm font-medium mb-1">Trabajo Más Antiguo</div>
            <div v-if="isLoading" class="h-8 flex items-center">
              <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
            </div>
            <div v-else-if="oldestJobAgeMinutes !== null" class="flex items-baseline gap-1">
              <span class="text-3xl font-bold" :class="hasOldJobs ? 'text-red-600' : 'text-green-600'">
                {{ oldestJobAgeMinutes }}
              </span>
              <span class="text-sm text-gray-500">min</span>
            </div>
            <div v-else class="text-2xl font-bold text-gray-400">-</div>
          </div>
          <div :class="hasOldJobs ? 'bg-red-100' : 'bg-green-100'" class="p-3 rounded-lg">
            <i
              class="pi text-2xl"
              :class="hasOldJobs ? 'pi-exclamation-triangle text-red-600' : 'pi-check-circle text-green-600'"
            ></i>
          </div>
        </div>
        <div v-if="hasOldJobs" class="mt-2">
          <Message severity="warn" :closable="false" class="text-xs">
            Hay trabajos esperando más de 5 minutos
          </Message>
        </div>
      </template>
    </Card>
  </div>

  <!-- Additional Info -->
  <div v-if="stats && !isLoading" class="mt-4">
    <Card>
      <template #content>
        <div class="text-sm text-gray-600">
          <div class="flex items-center justify-between">
            <span>Última actualización:</span>
            <span class="font-medium">{{ stats.timestamp }}</span>
          </div>
          <div v-if="stats.oldest_pending_job" class="flex items-center justify-between mt-2">
            <span>Cola del trabajo más antiguo:</span>
            <Tag :value="stats.oldest_pending_job.queue" severity="info" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
