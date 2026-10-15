<template>
  <p class="text-sm text-secondary-500">
    {{ label }}
    <a
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 font-medium text-primary hover:underline"
    >
      <i class="pi pi-whatsapp text-xs" aria-hidden="true"></i>
      Escríbenos por WhatsApp
    </a>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildSupportWhatsAppUrl } from '@/config/support'

interface Props {
  label?: string
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '¿Problemas para entrar?',
  message: 'Hola, tengo problemas para entrar a mi panel de MiTienda'
})

const url = computed(() => buildSupportWhatsAppUrl(props.message))
</script>
