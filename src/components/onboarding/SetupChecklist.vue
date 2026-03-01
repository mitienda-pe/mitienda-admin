<template>
  <div
    v-if="!onboardingStore.isAllComplete && !onboardingStore.isDismissed"
    class="bg-white rounded-lg shadow border-2 border-primary/20 p-6 mb-6"
    data-tour="setup-checklist"
  >
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Configura tu tienda</h2>
        <p class="text-sm text-gray-500 mt-1">Completa estos pasos para empezar a vender</p>
      </div>
      <button
        class="text-gray-400 hover:text-gray-600 text-sm"
        @click="onDismiss"
      >
        Ocultar
      </button>
    </div>

    <!-- Progress bar -->
    <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
      <div
        class="bg-primary h-2 rounded-full transition-all duration-500"
        :style="{ width: `${onboardingStore.setupProgress.percentage}%` }"
      />
    </div>
    <p class="text-xs text-gray-400 mb-4">
      {{ onboardingStore.setupProgress.completed }} de {{ onboardingStore.setupProgress.total }} completados
    </p>

    <!-- Checklist items -->
    <ul class="space-y-2">
      <li
        v-for="item in checklistItems"
        :key="item.id"
        class="flex items-center gap-3 p-3 rounded-lg transition-colors"
        :class="item.done
          ? 'bg-green-50'
          : 'bg-gray-50 hover:bg-primary/5 cursor-pointer'"
        @click="!item.done && onStartTour(item.tourId)"
      >
        <i
          :class="item.done
            ? 'pi pi-check-circle text-green-500'
            : `${item.icon} text-gray-400`"
          class="text-lg"
        />
        <div class="flex-1 min-w-0">
          <span
            class="text-sm font-medium"
            :class="item.done ? 'text-green-700 line-through' : 'text-gray-700'"
          >
            {{ item.label }}
          </span>
          <p class="text-xs text-gray-400 truncate">{{ item.description }}</p>
        </div>
        <i
          v-if="!item.done"
          class="pi pi-arrow-right text-primary text-sm flex-shrink-0"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useOnboarding } from '@/composables/useOnboarding'

const onboardingStore = useOnboardingStore()
const { startTour, dismissOnboarding } = useOnboarding()

const checklistItems = computed(() => [
  {
    id: 'welcome',
    tourId: 'welcome-flow',
    label: 'Conoce tu panel',
    description: 'Recorre la interfaz del backoffice',
    icon: 'pi pi-home',
    done: onboardingStore.state.welcome,
  },
  {
    id: 'products',
    tourId: 'products',
    label: 'Crea tu primer producto',
    description: 'Agrega los productos que vas a vender',
    icon: 'pi pi-box',
    done: onboardingStore.state.products,
  },
  {
    id: 'payments',
    tourId: 'payments',
    label: 'Configura formas de pago',
    description: 'Activa una pasarela de pago',
    icon: 'pi pi-credit-card',
    done: onboardingStore.state.payments,
  },
  {
    id: 'shipping',
    tourId: 'shipping',
    label: 'Configura tarifas de envio',
    description: 'Define los costos de envio',
    icon: 'pi pi-truck',
    done: onboardingStore.state.shipping,
  },
])

function onStartTour(tourId: string) {
  startTour(tourId)
}

function onDismiss() {
  dismissOnboarding()
}
</script>
