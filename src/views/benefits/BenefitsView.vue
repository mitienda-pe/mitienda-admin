<template>
  <div class="max-w-5xl">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-secondary">Beneficios</h1>
      <p class="text-sm text-secondary-500 mt-1">
        Ventajas por tener tu tienda en MiTienda: descuentos de nuestros partners y apps que suman a tu negocio.
      </p>
    </div>

    <div v-if="!store.isLoaded" class="flex justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <AppEmptyState
      v-else-if="!store.items.length"
      icon="pi-gift"
      title="Por ahora no hay beneficios"
      description="Cuando sumemos nuevos partners o apps, los encontrarás aquí."
    />

    <div v-else class="space-y-8">
      <section v-if="ownApps.length">
        <h2 class="text-sm font-semibold text-secondary-600 uppercase tracking-wide mb-3">Apps de MiTienda</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BenefitCard v-for="b in ownApps" :key="b.id" :benefit="b" source="page" />
        </div>
      </section>

      <section v-if="partners.length">
        <h2 class="text-sm font-semibold text-secondary-600 uppercase tracking-wide mb-3">De nuestros partners</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BenefitCard v-for="b in partners" :key="b.id" :benefit="b" source="page" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useBenefitsStore } from '@/stores/benefits.store'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import BenefitCard from '@/components/benefits/BenefitCard.vue'

const authStore = useAuthStore()
const store = useBenefitsStore()

const ownApps = computed(() => store.items.filter((b) => b.kind === 'own_app'))
const partners = computed(() => store.items.filter((b) => b.kind === 'partner'))

watch(() => authStore.selectedStore?.id ?? null, (id) => store.ensureLoaded(id), { immediate: true })
</script>
