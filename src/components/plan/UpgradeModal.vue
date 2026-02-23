<template>
  <Dialog
    v-model:visible="planStore.upgradeModalVisible"
    modal
    :closable="true"
    :draggable="false"
    class="w-full max-w-md"
    :pt="{ root: { class: 'rounded-xl' } }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <i class="pi pi-lock text-amber-600 text-lg"></i>
        </div>
        <span class="text-lg font-semibold text-secondary-800">
          Funcionalidad no disponible
        </span>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-secondary-600">
        <template v-if="planStore.upgradeModalModule">
          El modulo <strong>{{ planStore.upgradeModalModule.name }}</strong> no esta incluido
          en tu plan actual.
        </template>
        <template v-else>
          Esta funcionalidad no esta incluida en tu plan actual.
        </template>
      </p>

      <p class="text-secondary-600">
        Mejora tu plan para acceder a esta y otras funcionalidades avanzadas.
      </p>

      <div
        v-if="planStore.plan"
        class="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
      >
        <i class="pi pi-info-circle text-secondary-400"></i>
        <div class="text-sm text-secondary-600">
          Plan actual: <strong>{{ planStore.plan.name }}</strong>
          <span v-if="planStore.isPlanTrial" class="text-amber-600 ml-1">(Trial)</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton variant="secondary" @click="planStore.hideUpgradeModal()">
          Cerrar
        </AppButton>
        <AppButton variant="primary" @click="openPlans">
          <i class="pi pi-external-link mr-2"></i>
          Ver Planes
        </AppButton>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { AppButton } from '@/components/ui'
import { usePlanStore } from '@/stores/plan.store'

const planStore = usePlanStore()

function openPlans() {
  window.open('https://mitienda.pe/planes', '_blank')
  planStore.hideUpgradeModal()
}
</script>
