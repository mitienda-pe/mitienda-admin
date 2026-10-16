import { welcomeTourSteps } from './tour-welcome'
import { interfaceTourSteps } from './tour-interface'
import { productsTourSteps } from './tour-products'
import { paymentsTourSteps } from './tour-payments'
import { shippingTourSteps } from './tour-shipping'
import type { DriveStep } from 'driver.js'
import type { OnboardingStepKey } from '@/types/onboarding.types'

export interface TourDefinition {
  id: string
  label: string
  description: string
  route: string
  steps: DriveStep[]
  /**
   * Paso del checklist al que acompaña este recorrido. Solo se usa para
   * ofrecer "Ver video" en el último paso: terminar el recorrido ya NO marca
   * el paso como hecho (eso lo deciden los datos reales de la tienda).
   */
  stepKey?: OnboardingStepKey
  icon: string
}

export const TOUR_DEFINITIONS: TourDefinition[] = [
  {
    id: 'welcome-flow',
    label: 'Conoce tu panel',
    description: 'Recorre la interfaz del panel',
    route: '/dashboard',
    steps: [...welcomeTourSteps, ...interfaceTourSteps],
    icon: 'pi pi-home'
  },
  {
    id: 'products',
    label: 'Crea tu primer producto',
    description: 'Agrega los productos que vas a vender',
    route: '/products/create',
    steps: productsTourSteps,
    stepKey: 'first_product',
    icon: 'pi pi-box'
  },
  {
    id: 'payments',
    label: 'Configura formas de pago',
    description: 'Activa una pasarela de pago',
    route: '/payment-gateways',
    steps: paymentsTourSteps,
    stepKey: 'payments',
    icon: 'pi pi-credit-card'
  },
  {
    id: 'shipping',
    label: 'Configura tarifas de envío',
    description: 'Define los costos de envío',
    route: '/shipping/rates',
    steps: shippingTourSteps,
    stepKey: 'shipping',
    icon: 'pi pi-truck'
  }
]
