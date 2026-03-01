import { driver, type Driver, type Config } from 'driver.js'
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { TOUR_DEFINITIONS, type TourDefinition } from '@/config/onboarding'

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
  allowClose: true,
}

let driverInstance: Driver | null = null

export function useOnboarding() {
  const router = useRouter()
  const store = useOnboardingStore()

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

  function launchTour(tourDef: TourDefinition) {
    if (driverInstance) {
      driverInstance.destroy()
    }

    store.setActiveTour(tourDef.id)

    driverInstance = driver({
      ...DRIVER_BASE_CONFIG,
      steps: tourDef.steps,
      onDestroyStarted: () => {
        if (driverInstance && !driverInstance.hasNextStep()) {
          // Completed all steps
          for (const key of tourDef.completionKeys) {
            store.completeTour(key)
          }
        }
        driverInstance?.destroy()
      },
      onDestroyed: () => {
        store.setActiveTour(null)
        driverInstance = null
      },
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
    store.dismiss()
  }

  function resetOnboarding() {
    store.reset()
  }

  return {
    startTour,
    launchTour,
    resumeTourIfPending,
    dismissOnboarding,
    resetOnboarding,
  }
}
