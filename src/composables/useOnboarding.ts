import { driver, type Driver, type Config, type DriveStep } from 'driver.js'
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { TOUR_DEFINITIONS, type TourDefinition } from '@/config/onboarding'
import { getOnboardingVideo } from '@/config/onboarding/videos'
import { useOnboardingVideo } from '@/composables/useOnboardingVideo'

const DRIVER_BASE_CONFIG: Config = {
  showProgress: true,
  animate: true,
  stagePadding: 8,
  stageRadius: 8,
  popoverClass: 'onboarding-popover',
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Entendido',
  progressText: '{{current}} de {{total}}',
  allowClose: true
}

let driverInstance: Driver | null = null

export function useOnboarding() {
  const router = useRouter()
  const store = useOnboardingStore()
  const { openVideo } = useOnboardingVideo()

  function startTour(tourId: string) {
    const tourDef = TOUR_DEFINITIONS.find(t => t.id === tourId)
    if (!tourDef) return

    // If not on the right page, navigate first
    if (router.currentRoute.value.path !== tourDef.route) {
      store.setActiveTour(tourId)
      router.push(tourDef.route)
      return
    }

    launchTour(tourDef)
  }

  /**
   * Si el paso del checklist de este recorrido tiene video, el último paso del
   * recorrido ofrece "Ver video": cierra el recorrido (cuenta como terminado)
   * y abre el diálogo.
   */
  function withVideoButton(tourDef: TourDefinition): DriveStep[] {
    const stepKey = tourDef.stepKey
    if (!stepKey || !getOnboardingVideo(stepKey) || tourDef.steps.length === 0) {
      return tourDef.steps
    }
    const steps = [...tourDef.steps]
    const last = steps[steps.length - 1]!
    steps[steps.length - 1] = {
      ...last,
      popover: {
        ...last.popover,
        onPopoverRender: popover => {
          const btn = document.createElement('button')
          btn.type = 'button'
          btn.className = 'onboarding-video-btn'
          btn.innerHTML = '<i class="pi pi-play-circle"></i> Ver video'
          btn.addEventListener('click', () => {
            // destroy() público de driver.js NO llama a onDestroyStarted:
            // el recorrido terminado se registra aquí.
            void store.completeTour(tourDef.id)
            driverInstance?.destroy()
            openVideo(stepKey)
          })
          popover.footerButtons.prepend(btn)
        }
      }
    }
    return steps
  }

  function launchTour(tourDef: TourDefinition) {
    if (driverInstance) {
      driverInstance.destroy()
    }

    store.setActiveTour(tourDef.id)

    driverInstance = driver({
      ...DRIVER_BASE_CONFIG,
      steps: withVideoButton(tourDef),
      onDestroyStarted: () => {
        if (driverInstance && !driverInstance.hasNextStep()) {
          // Recorrido completo: se registra en el API, pero NO marca pasos del
          // checklist (eso depende de los datos reales de la tienda).
          void store.completeTour(tourDef.id)
        }
        driverInstance?.destroy()
      },
      onDestroyed: () => {
        store.setActiveTour(null)
        driverInstance = null
      }
    })

    driverInstance.drive()
  }

  async function resumeTourIfPending() {
    const pendingTourId = store.activeTourId
    if (!pendingTourId) return

    const tourDef = TOUR_DEFINITIONS.find(t => t.id === pendingTourId)
    if (!tourDef) return

    if (router.currentRoute.value.path !== tourDef.route) return

    // Wait for DOM readiness
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 600))

    launchTour(tourDef)
  }

  function dismissOnboarding() {
    if (driverInstance) {
      driverInstance.destroy()
    }
    return store.dismiss()
  }

  return {
    startTour,
    launchTour,
    resumeTourIfPending,
    dismissOnboarding
  }
}
