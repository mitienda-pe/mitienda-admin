import type { OnboardingStepKey } from '@/types/onboarding.types'

const HELP_BASE = 'https://ayuda.mitienda.pe'

export interface OnboardingStepDefinition {
  key: OnboardingStepKey
  title: string
  /** Una línea: por qué importa este paso. */
  why: string
  icon: string
  /** Ruta del panel para "Hazlo ahora". `share_store` abre la tienda en vez de navegar. */
  route: string | null
  /** Página del centro de ayuda para "Ver guía". */
  guideUrl: string
}

/** Orden en que se muestran en el checklist. */
export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    key: 'first_product',
    title: 'Sube tu primer producto (con foto)',
    why: 'Un producto con foto vende mucho más que uno sin imagen.',
    icon: 'pi pi-box',
    route: '/products/create',
    guideUrl: `${HELP_BASE}/05-catalogo/11-imagenes-productos`
  },
  {
    key: 'payments',
    title: 'Elige cómo cobrar',
    why: 'Yape, transferencia o tarjeta: activa al menos una forma de pago.',
    icon: 'pi pi-credit-card',
    route: '/payment-gateways',
    guideUrl: `${HELP_BASE}/09-formas-pago`
  },
  {
    key: 'shipping',
    title: 'Define tu envío o recojo en tienda',
    why: 'Tus clientes necesitan saber cuánto cuesta el envío o dónde recoger.',
    icon: 'pi pi-truck',
    route: '/shipping/rates',
    guideUrl: `${HELP_BASE}/10-envios`
  },
  {
    key: 'branding',
    title: 'Pon tu logo y tus colores',
    why: 'Tu marca hace que la tienda se vea confiable desde el primer clic.',
    icon: 'pi pi-palette',
    route: '/appearance/config',
    guideUrl: `${HELP_BASE}/08-apariencia/01-general`
  },
  {
    key: 'share_store',
    title: 'Mira y comparte tu tienda',
    why: 'Revisa cómo la ven tus clientes y comparte el link en tus redes.',
    icon: 'pi pi-share-alt',
    route: null,
    guideUrl: `${HELP_BASE}/12-configuracion/12-link-de-tu-tienda`
  },
  {
    key: 'choose_plan',
    title: 'Elige tu plan',
    why: 'Escoge un plan antes de que termine tu prueba gratis para no perder ventas.',
    icon: 'pi pi-star',
    route: '/store/subscription',
    guideUrl: `${HELP_BASE}/19-planes-y-precios`
  }
]
