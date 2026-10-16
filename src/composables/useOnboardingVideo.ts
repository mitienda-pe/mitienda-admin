import { computed, ref } from 'vue'
import { getOnboardingVideo } from '@/config/onboarding/videos'
import type { OnboardingStepKey } from '@/types/onboarding.types'

// Estado de módulo: el checklist y los recorridos de driver.js (que no son
// componentes) abren el MISMO diálogo, montado una sola vez en el layout.
const activeKey = ref<OnboardingStepKey | null>(null)

export function useOnboardingVideo() {
  const activeVideo = computed(() => getOnboardingVideo(activeKey.value))

  function openVideo(key: OnboardingStepKey) {
    if (!getOnboardingVideo(key)) return
    activeKey.value = key
  }

  function closeVideo() {
    activeKey.value = null
  }

  return { activeKey, activeVideo, openVideo, closeVideo, hasVideo: getOnboardingVideo }
}
