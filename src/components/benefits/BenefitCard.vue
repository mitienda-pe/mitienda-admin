<template>
  <!-- Menú lateral: angosto, solo título (el texto se lee en la página) -->
  <div v-if="variant === 'compact'" class="rounded-lg border border-gray-200 bg-white p-2.5">
    <span class="block text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">Beneficio MiTienda</span>
    <a
      :href="benefit.cta_url"
      target="_blank"
      rel="noopener sponsored"
      class="flex gap-2.5 group"
      @click="onCta"
    >
      <img
        v-if="benefit.image_url"
        :src="benefit.image_url"
        alt=""
        width="78"
        height="60"
        loading="lazy"
        class="w-[78px] h-[60px] shrink-0 rounded object-cover bg-gray-100"
      />
      <span class="min-w-0">
        <span class="block text-[11px] text-gray-500 truncate">{{ benefit.partner_name }}</span>
        <span class="block text-xs font-semibold text-gray-900 leading-snug line-clamp-3 group-hover:text-primary">
          {{ benefit.title }}
        </span>
      </span>
    </a>
    <div class="mt-2 flex items-center justify-between gap-2">
      <a
        :href="benefit.cta_url"
        target="_blank"
        rel="noopener sponsored"
        class="text-xs font-medium text-primary hover:underline truncate"
        @click="onCta"
      >
        {{ benefit.cta_label }} →
      </a>
      <router-link to="/benefits" class="text-[11px] text-gray-400 hover:text-primary shrink-0">Ver todos</router-link>
    </div>
  </div>

  <!-- Inicio, pantallas y página: imagen 130×100 + texto -->
  <div v-else class="rounded-xl border border-gray-200 bg-white p-3 flex gap-3">
    <a
      v-if="benefit.image_url"
      :href="benefit.cta_url"
      target="_blank"
      rel="noopener sponsored"
      class="shrink-0"
      tabindex="-1"
      aria-hidden="true"
      @click="onCta"
    >
      <img
        :src="benefit.image_url"
        alt=""
        width="130"
        height="100"
        loading="lazy"
        class="w-[100px] h-[77px] sm:w-[130px] sm:h-[100px] rounded-lg object-cover bg-gray-100"
      />
    </a>
    <div class="min-w-0 flex-1 flex flex-col">
      <span class="text-[10px] uppercase tracking-wide text-gray-400">
        Beneficio MiTienda · {{ benefit.partner_name }}
      </span>
      <span class="text-sm font-semibold text-gray-900 leading-snug mt-0.5">{{ benefit.title }}</span>
      <span class="text-xs text-gray-600 leading-snug mt-1">{{ benefit.body }}</span>
      <div class="mt-auto pt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <button
          v-if="benefit.promo_code"
          type="button"
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-gray-300 text-[11px] font-mono text-gray-700 hover:border-primary hover:text-primary"
          :aria-label="`Copiar el código ${benefit.promo_code}`"
          @click="copyCode"
        >
          {{ benefit.promo_code }}
          <i :class="copied ? 'pi pi-check text-primary' : 'pi pi-copy'" style="font-size: 0.65rem" />
        </button>
        <a
          :href="benefit.cta_url"
          target="_blank"
          rel="noopener sponsored"
          class="text-xs font-medium text-primary hover:underline"
          @click="onCta"
        >
          {{ benefit.cta_label }} →
        </a>
        <router-link
          v-if="showSeeAll"
          to="/benefits"
          class="ml-auto text-[11px] text-gray-400 hover:text-primary"
        >
          Ver todos los beneficios
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBenefitsStore } from '@/stores/benefits.store'
import type { Benefit, BenefitClickSource } from '@/types/benefit.types'

const props = withDefaults(
  defineProps<{
    benefit: Benefit
    source: BenefitClickSource
    variant?: 'wide' | 'compact'
    showSeeAll?: boolean
  }>(),
  { variant: 'wide', showSeeAll: false }
)

const store = useBenefitsStore()
const copied = ref(false)

function onCta() {
  store.trackClick(props.benefit.id, props.source, 'cta')
}

async function copyCode() {
  if (!props.benefit.promo_code) return
  try {
    await navigator.clipboard.writeText(props.benefit.promo_code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // Sin permiso de portapapeles el código igual queda a la vista.
  }
  store.trackClick(props.benefit.id, props.source, 'copy_code')
}
</script>
