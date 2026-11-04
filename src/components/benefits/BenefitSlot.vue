<template>
  <BenefitCard
    v-if="benefit"
    :benefit="benefit"
    :source="placement"
    :variant="placement === 'sidebar' ? 'compact' : 'wide'"
    :show-see-all="placement !== 'sidebar'"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'
import { useBenefitsStore } from '@/stores/benefits.store'
import type { Benefit, BenefitSlot } from '@/types/benefit.types'
import BenefitCard from './BenefitCard.vue'

/**
 * Un espacio de beneficio. Elige uno al montarse; el del menú lateral (que no
 * se desmonta al navegar) rota al cambiar de pantalla.
 */
const props = defineProps<{ placement: BenefitSlot }>()

const route = useRoute()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const store = useBenefitsStore()

const picked = ref<Benefit | null>(null)

// El superadmin sin impersonar no opera una tienda: no se le muestra nada.
const enabled = computed(() => !!authStore.selectedStore?.id && (!authStore.isSuperAdmin || adminStore.isImpersonating))

const benefit = computed(() => (enabled.value ? picked.value : null))

function choose() {
  if (props.placement === 'sidebar') {
    picked.value = store.pick('sidebar')
    store.sidebarBenefitId = picked.value?.id ?? null
  } else {
    picked.value = store.pick(props.placement, store.sidebarBenefitId)
  }
}

watch(
  () => authStore.selectedStore?.id ?? null,
  async (storeId) => {
    if (!enabled.value) return
    await store.ensureLoaded(storeId)
    choose()
  },
  { immediate: true }
)

if (props.placement === 'sidebar') {
  watch(() => route.path, () => { if (store.isLoaded) choose() })
}
</script>
