<template>
  <div class="store-card bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- Nombre y URL -->
        <div class="mb-2">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ store.name }}
          </h3>
          <a
            :href="store.url"
            target="_blank"
            class="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            {{ store.url }}
            <i class="pi pi-external-link text-xs"></i>
          </a>
        </div>

        <!-- Owner Info -->
        <div class="mb-3 text-sm text-gray-600">
          <div class="flex items-center gap-2 mb-1">
            <i class="pi pi-user"></i>
            <span>{{ store.owner.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-envelope"></i>
            <span>{{ store.owner.email }}</span>
          </div>
        </div>

        <!-- Plan Info -->
        <div class="flex flex-wrap gap-2 mb-3">
          <span
            class="px-2 py-1 text-xs font-medium rounded-full"
            :class="planStatusClass"
          >
            {{ planStatusLabel }}
          </span>
          <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            {{ store.plan.name }}
          </span>
          <span
            v-if="store.ssl_enabled"
            class="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1"
          >
            <i class="pi pi-lock"></i>
            SSL
          </span>
        </div>

        <!-- Dates -->
        <div class="text-xs text-gray-500 space-y-1">
          <div v-if="store.plan.expires_at">
            Vence: {{ formatDate(store.plan.expires_at) }}
          </div>
          <div>
            Creada: {{ formatDate(store.created_at) }}
          </div>
        </div>
      </div>

      <!-- Botón Acceder -->
      <div class="ml-4">
        <button
          @click="$emit('impersonate', store.id)"
          :disabled="loading"
          class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i class="pi pi-sign-in"></i>
          <span>Acceder</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AdminStore } from '@/types/admin.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  store: AdminStore
  loading?: boolean
}

interface Emits {
  (e: 'impersonate', storeId: number): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const planStatusClass = computed(() => {
  switch (props.store.plan.status) {
    case 'active':
      return 'bg-green-100 text-green-700'
    case 'expired':
      return 'bg-red-100 text-red-700'
    case 'suspended':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
})

const planStatusLabel = computed(() => {
  switch (props.store.plan.status) {
    case 'active':
      return 'Activo'
    case 'expired':
      return 'Vencido'
    case 'suspended':
      return 'Suspendido'
    default:
      return props.store.plan.status
  }
})

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.store-card {
  /* Estilos adicionales si es necesario */
}
</style>
