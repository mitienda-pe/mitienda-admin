<template>
  <Dialog
    :visible="!!activeVideo"
    modal
    :header="title"
    :style="{ width: '56rem' }"
    :breakpoints="{ '960px': '90vw', '640px': '96vw' }"
    :dismissable-mask="true"
    @update:visible="onVisibleChange"
  >
    <div
      v-if="activeVideo?.youtubeId"
      class="relative w-full overflow-hidden rounded-lg bg-black"
      style="padding-top: 56.25%"
    >
      <iframe
        class="absolute inset-0 h-full w-full"
        :src="youtubeEmbedUrl(activeVideo.youtubeId)"
        :title="title"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
        "
        allowfullscreen
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import { useOnboardingVideo } from '@/composables/useOnboardingVideo'
import { youtubeEmbedUrl } from '@/config/onboarding/videos'
import { ONBOARDING_STEPS } from '@/config/onboarding/steps'

const { activeKey, activeVideo, closeVideo } = useOnboardingVideo()

const title = computed(() => {
  const step = ONBOARDING_STEPS.find(s => s.key === activeKey.value)
  const duration = activeVideo.value?.durationLabel ? ` (${activeVideo.value.durationLabel})` : ''
  return step ? `${step.title}${duration}` : 'Video'
})

function onVisibleChange(visible: boolean) {
  // Al cerrar se desmonta el iframe y el video deja de sonar.
  if (!visible) closeVideo()
}
</script>
