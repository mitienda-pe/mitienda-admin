import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBenefitsStore } from '@/stores/benefits.store'
import { benefitsApi } from '@/api/benefits.api'
import type { Benefit } from '@/types/benefit.types'

vi.mock('@/api/benefits.api', () => ({
  benefitsApi: {
    list: vi.fn(),
    click: vi.fn(() => Promise.resolve())
  }
}))

function benefit(id: number, slots: Benefit['slots'], weight = 1): Benefit {
  return {
    id,
    kind: 'partner',
    partner_name: 'P',
    title: 'T',
    body: 'B',
    image_url: null,
    promo_code: null,
    cta_label: 'Ir',
    cta_url: 'https://example.com',
    slots,
    weight
  }
}

describe('benefits store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(benefitsApi.list).mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('pide la lista una sola vez por tienda', async () => {
    vi.mocked(benefitsApi.list).mockResolvedValue([benefit(1, ['dashboard'])])
    const store = useBenefitsStore()

    await Promise.all([store.ensureLoaded(5), store.ensureLoaded(5)])
    await store.ensureLoaded(5)
    expect(benefitsApi.list).toHaveBeenCalledTimes(1)

    await store.ensureLoaded(6)
    expect(benefitsApi.list).toHaveBeenCalledTimes(2)
  })

  it('si la API falla no muestra nada, sin romper', async () => {
    vi.mocked(benefitsApi.list).mockRejectedValue(new Error('500'))
    const store = useBenefitsStore()

    await store.ensureLoaded(5)

    expect(store.isLoaded).toBe(true)
    expect(store.pick('dashboard')).toBeNull()
  })

  it('solo elige entre los del espacio', () => {
    const store = useBenefitsStore()
    store.items = [benefit(1, ['orders']), benefit(2, ['dashboard'])]

    expect(store.pick('dashboard')?.id).toBe(2)
    expect(store.pick('customers')).toBeNull()
  })

  it('evita repetir el del menú lateral salvo que sea el único', () => {
    const store = useBenefitsStore()
    store.items = [benefit(1, ['sidebar', 'orders']), benefit(2, ['orders'])]

    for (let i = 0; i < 20; i++) expect(store.pick('orders', 1)?.id).toBe(2)

    store.items = [benefit(1, ['sidebar', 'orders'])]
    expect(store.pick('orders', 1)?.id).toBe(1)
  })

  it('el peso decide la rotación', () => {
    const store = useBenefitsStore()
    store.items = [benefit(1, ['dashboard'], 1), benefit(2, ['dashboard'], 3)]

    vi.spyOn(Math, 'random').mockReturnValue(0.2) // 0.8 de 4 → cae en el primero
    expect(store.pick('dashboard')?.id).toBe(1)

    vi.spyOn(Math, 'random').mockReturnValue(0.3) // 1.2 de 4 → cae en el segundo
    expect(store.pick('dashboard')?.id).toBe(2)
  })
})
