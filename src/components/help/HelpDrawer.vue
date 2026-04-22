<template>
  <Sidebar
    v-model:visible="isOpen"
    position="right"
    :style="{ width: '540px' }"
    class="help-drawer"
  >
    <template #header>
      <div class="flex items-center gap-3 w-full">
        <div class="flex items-center gap-2">
          <i class="pi pi-question-circle text-primary text-xl"></i>
          <span class="font-semibold text-lg">Ayuda</span>
        </div>

        <a
          href="https://wa.me/51967797232?text=Hola%20Renato%2C%20necesito%20ayuda%20con%20MiTienda"
          target="_blank"
          rel="noopener noreferrer"
          class="support-pill ml-auto group"
          title="Habla con Renato por WhatsApp"
        >
          <span class="support-pill__avatar">
            <span class="support-pill__initial">R</span>
            <span class="support-pill__status"></span>
          </span>
          <span class="support-pill__text">
            <span class="support-pill__label">Soporte humano</span>
            <span class="support-pill__name">Habla con Renato</span>
          </span>
          <i class="pi pi-whatsapp support-pill__icon"></i>
        </a>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-20 text-gray-500">
      <i class="pi pi-exclamation-triangle text-3xl mb-3 block"></i>
      <p>No se pudo cargar la ayuda.</p>
      <button
        class="mt-3 text-primary hover:underline text-sm"
        @click="fetchDoc"
      >
        Reintentar
      </button>
    </div>

    <!-- Content -->
    <div
      v-else
      class="prose prose-sm max-w-none
             prose-headings:text-gray-800
             prose-a:text-primary
             prose-img:rounded-lg"
      v-html="html"
    />
  </Sidebar>
</template>

<script setup lang="ts">
import Sidebar from 'primevue/sidebar'
import { useHelpDocs } from '@/composables/useHelpDocs'

const { html, loading, error, isOpen, fetchDoc } = useHelpDocs()
</script>

<style scoped>
.help-drawer :deep(.p-sidebar-content) {
  padding: 1rem 1.5rem;
}

.support-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 0.75rem;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 2px 6px rgba(37, 211, 102, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.support-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(37, 211, 102, 0.45);
}

.support-pill__avatar {
  position: relative;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.55);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.support-pill__initial {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
}

.support-pill__status {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 9999px;
  background: #4ade80;
  box-shadow: 0 0 0 2px #128c7e;
  animation: support-pulse 2s ease-in-out infinite;
}

.support-pill__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.support-pill__label {
  font-size: 0.625rem;
  opacity: 0.85;
  letter-spacing: 0.02em;
}

.support-pill__name {
  font-size: 0.8125rem;
  font-weight: 600;
}

.support-pill__icon {
  font-size: 1rem;
  margin-left: 0.125rem;
}

@keyframes support-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.15); opacity: 0.85; }
}
</style>
