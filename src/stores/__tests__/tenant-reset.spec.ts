import { describe, it, expect, beforeEach } from 'vitest'
import { createApp, ref } from 'vue'
import { createPinia, defineStore, setActivePinia, type Pinia } from 'pinia'
import { tenantResetPlugin, resetTenantStores } from '@/stores/plugins/tenant-reset'

const useConfigStore = defineStore('tenant-reset-config', () => {
  const isLoaded = ref(false)
  const config = ref<{ swMostrarHorarioEnvio: boolean } | null>(null)
  const optional = ref<string | undefined>(undefined)
  return { isLoaded, config, optional }
})

const useAuthLikeStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  return { token }
})

describe('tenant-reset plugin', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    pinia.use(tenantResetPlugin)
    createApp({}).use(pinia) // los plugins de Pinia solo corren con una app
    setActivePinia(pinia)
  })

  it('devuelve al estado inicial lo cargado para la tienda anterior', () => {
    const store = useConfigStore()
    store.isLoaded = true
    store.config = { swMostrarHorarioEnvio: true }
    store.optional = 'x'

    resetTenantStores(pinia)

    expect(store.isLoaded).toBe(false)
    expect(store.config).toBeNull()
    expect(store.optional).toBeUndefined()
  })

  it('no toca la sesión', () => {
    const auth = useAuthLikeStore()
    auth.token = 'abc'

    resetTenantStores(pinia)

    expect(auth.token).toBe('abc')
  })
})
