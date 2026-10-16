import type { OnboardingStepKey } from '@/types/onboarding.types'

export interface OnboardingVideo {
  /** ID del video de YouTube (lo que va después de `watch?v=`). null = sin video. */
  youtubeId: string | null
  /** Texto corto de duración, p. ej. "1:30". */
  durationLabel?: string
}

/**
 * Video corto por paso del checklist. Es el ÚNICO lugar donde se configuran:
 * con `youtubeId` en null el botón "Ver video" no aparece (ni en el checklist
 * ni en el último paso del recorrido guiado correspondiente).
 */
export const ONBOARDING_VIDEOS: Record<OnboardingStepKey, OnboardingVideo> = {
  first_product: { youtubeId: null },
  payments: { youtubeId: null },
  shipping: { youtubeId: null },
  branding: { youtubeId: null },
  share_store: { youtubeId: null },
  choose_plan: { youtubeId: null }
}

export function getOnboardingVideo(
  key: OnboardingStepKey | undefined | null
): OnboardingVideo | null {
  if (!key) return null
  const video = ONBOARDING_VIDEOS[key]
  return video?.youtubeId ? video : null
}

/** URL de inserción sin cookies de seguimiento (permitida por la CSP en frame-src). */
export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?rel=0&autoplay=1`
}
