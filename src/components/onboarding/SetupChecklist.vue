<template>
  <div
    v-if="visible"
    class="bg-white rounded-lg shadow border-2 border-primary/20 p-6 mb-6"
    data-tour="setup-checklist"
  >
    <!-- Cargando (solo la primera vez: al volver al dashboard se refresca sin parpadeo) -->
    <div
      v-if="onboardingStore.loading && !onboardingStore.progress"
      class="flex items-center gap-3 text-sm text-gray-500"
    >
      <i class="pi pi-spin pi-spinner text-primary" />
      Revisando la configuración de tu tienda…
    </div>

    <!-- Error -->
    <AppErrorState
      v-else-if="onboardingStore.error && !onboardingStore.progress"
      title="No pudimos revisar tu tienda"
      :message="onboardingStore.error"
      @retry="onboardingStore.fetchProgress()"
    />

    <!-- Todo listo -->
    <div
      v-else-if="onboardingStore.isAllComplete"
      class="flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <i class="pi pi-check-circle text-4xl text-primary" />
      <div class="flex-1">
        <h2 class="text-lg font-semibold text-gray-900">¡Tu tienda está lista para vender!</h2>
        <p class="text-sm text-gray-500 mt-1">
          Completaste los {{ onboardingStore.totalCount }} pasos. Comparte tu link y empieza a
          recibir pedidos.
        </p>
      </div>
      <AppButton label="Ocultar" variant="outlined" size="small" @click="onDismiss" />
    </div>

    <!-- Checklist -->
    <template v-else>
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Configura tu tienda</h2>
          <p class="text-sm text-gray-500 mt-1">Completa estos pasos para empezar a vender</p>
        </div>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0"
          @click="onDismiss"
        >
          Ocultar
        </button>
      </div>

      <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-500"
          :style="{ width: `${onboardingStore.percentage}%` }"
        />
      </div>
      <p class="text-xs text-gray-500 mb-4">
        {{ onboardingStore.completedCount }} de {{ onboardingStore.totalCount }} completados
      </p>

      <ul class="space-y-2">
        <li
          v-for="step in onboardingStore.steps"
          :key="step.key"
          class="flex items-start gap-3 p-3 rounded-lg"
          :class="
            step.done
              ? 'bg-green-50'
              : step.key === currentKey
                ? 'bg-primary/5 ring-1 ring-primary/30'
                : 'bg-gray-50'
          "
        >
          <i
            :class="step.done ? 'pi pi-check-circle text-green-600' : `${step.icon} text-gray-400`"
            class="text-lg mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium"
              :class="step.done ? 'text-green-700 line-through' : 'text-gray-800'"
            >
              {{ step.title }}
            </p>
            <p v-if="!step.done" class="text-xs text-gray-500 mt-0.5">{{ whyFor(step) }}</p>

            <div v-if="!step.done" class="flex flex-wrap items-center gap-2 mt-2">
              <!-- Mira y comparte: abre la tienda y copia el link -->
              <template v-if="step.key === 'share_store'">
                <AppButton
                  label="Ver mi tienda"
                  icon="pi pi-external-link"
                  size="small"
                  :variant="step.key === currentKey ? 'primary' : 'outlined'"
                  :disabled="!storefrontUrl"
                  @click="openStore"
                />
                <AppButton
                  label="Copiar link"
                  icon="pi pi-copy"
                  size="small"
                  variant="text"
                  :disabled="!storefrontUrl"
                  @click="copyStoreLink"
                />
              </template>
              <AppButton
                v-else-if="routeFor(step)"
                label="Hazlo ahora"
                size="small"
                :variant="step.key === currentKey ? 'primary' : 'outlined'"
                @click="router.push(routeFor(step)!)"
              />
              <a
                :href="step.guideUrl"
                target="_blank"
                rel="noopener"
                class="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <i class="pi pi-book text-xs" /> Ver guía
              </a>
              <button
                v-if="hasVideo(step.key)"
                type="button"
                class="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                @click="openVideo(step.key)"
              >
                <i class="pi pi-play-circle text-xs" /> Ver video
                <span v-if="hasVideo(step.key)?.durationLabel" class="text-gray-400">
                  ({{ hasVideo(step.key)?.durationLabel }})
                </span>
              </button>
            </div>
          </div>
        </li>
      </ul>

      <div class="mt-4 text-right">
        <button
          type="button"
          class="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
          @click="startTour('welcome-flow')"
        >
          <i class="pi pi-compass text-xs" /> Ver recorrido del panel
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppErrorState } from '@/components/ui'
import { useOnboardingStore, type OnboardingChecklistStep } from '@/stores/onboarding.store'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboarding } from '@/composables/useOnboarding'
import { useOnboardingVideo } from '@/composables/useOnboardingVideo'

const router = useRouter()
const toast = useToast()
const onboardingStore = useOnboardingStore()
const authStore = useAuthStore()
const { startTour, dismissOnboarding } = useOnboarding()
const { openVideo, hasVideo } = useOnboardingVideo()

const visible = computed(() => !onboardingStore.isDismissed)

/** El primer paso pendiente se resalta y lleva el botón principal. */
const currentKey = computed(() => onboardingStore.steps.find(s => !s.done)?.key ?? null)

const storefrontUrl = computed(() => {
  const store = authStore.selectedStore
  if (store?.url) return store.url.startsWith('http') ? store.url : `https://${store.url}`
  if (store?.slug) return `https://${store.slug}.mitienda.pe`
  return null
})

/** Ya tiene productos pero ninguno con foto: el paso no está hecho y el texto lo dice. */
function lacksPhotoOnly(step: OnboardingChecklistStep): boolean {
  return (
    step.key === 'first_product' &&
    Number(step.meta.products_active ?? 0) > 0 &&
    !step.meta.has_image
  )
}

function whyFor(step: OnboardingChecklistStep): string {
  if (lacksPhotoOnly(step)) return 'Ya tienes productos: súbele una foto a al menos uno.'
  return step.why
}

function routeFor(step: OnboardingChecklistStep): string | null {
  if (lacksPhotoOnly(step)) return '/products'
  return step.route
}

function openStore() {
  if (!storefrontUrl.value) return
  window.open(storefrontUrl.value, '_blank', 'noopener')
  void onboardingStore.markStoreLinkOpened()
}

async function copyStoreLink() {
  if (!storefrontUrl.value) return
  try {
    await navigator.clipboard.writeText(storefrontUrl.value)
    toast.add({
      severity: 'success',
      summary: 'Link copiado',
      detail: storefrontUrl.value,
      life: 3000
    })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'No se pudo copiar',
      detail: `Copia el link a mano: ${storefrontUrl.value}`,
      life: 6000
    })
  }
}

function onDismiss() {
  void dismissOnboarding()
}
</script>
