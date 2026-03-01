import { welcomeTourSteps } from './tour-welcome'
import { interfaceTourSteps } from './tour-interface'
import { productsTourSteps } from './tour-products'
import { paymentsTourSteps } from './tour-payments'
import { shippingTourSteps } from './tour-shipping'
import type { DriveStep } from 'driver.js'
import type { OnboardingState } from '@/stores/onboarding.store'

export interface TourDefinition {
  id: string
  label: string
  description: string
  route: string
  steps: DriveStep[]
  /** Keys to mark as complete when this tour finishes */
  completionKeys: (keyof Omit<OnboardingState, 'dismissedAt' | 'completedAt'>)[]
  icon: string
}

export const TOUR_DEFINITIONS: TourDefinition[] = [
  {
    id: 'welcome-flow',
    label: 'Conoce tu panel',
    description: 'Recorre la interfaz del backoffice',
    route: '/dashboard',
    steps: [...welcomeTourSteps, ...interfaceTourSteps],
    completionKeys: ['welcome'],
    icon: 'pi pi-home',
  },
  {
    id: 'products',
    label: 'Crea tu primer producto',
    description: 'Agrega los productos que vas a vender',
    route: '/products/create',
    steps: productsTourSteps,
    completionKeys: ['products'],
    icon: 'pi pi-box',
  },
  {
    id: 'payments',
    label: 'Configura formas de pago',
    description: 'Activa una pasarela de pago',
    route: '/payment-gateways',
    steps: paymentsTourSteps,
    completionKeys: ['payments'],
    icon: 'pi pi-credit-card',
  },
  {
    id: 'shipping',
    label: 'Configura tarifas de envio',
    description: 'Define los costos de envio',
    route: '/shipping/rates',
    steps: shippingTourSteps,
    completionKeys: ['shipping'],
    icon: 'pi pi-truck',
  },
]
