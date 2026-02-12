import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { domainApi } from '@/api/domain.api'
import type { StoreDomainSettings, DnsVerification } from '@/types/domain.types'

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const DEFAULT_SETTINGS: StoreDomainSettings = {
  tienda_dominio: null,
  tienda_dominio_verificado: 0,
  tienda_ssl: 0,
  tienda_nombreurl: '',
  domain_type: null,
  default_url: '',
  dns_instructions: null
}

export const useDomainStore = defineStore('domain', () => {
  const savedSettings = ref<StoreDomainSettings>(deepClone(DEFAULT_SETTINGS))
  const draftDomain = ref<string>('')

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isVerifying = ref(false)
  const error = ref<string | null>(null)
  const verificationResult = ref<DnsVerification | null>(null)

  const hasChanges = computed(() => {
    const current = draftDomain.value.trim()
    const saved = savedSettings.value.tienda_dominio ?? ''
    return current !== saved
  })

  async function fetchSettings() {
    isLoading.value = true
    error.value = null
    try {
      const response = await domainApi.getSettings()
      if (response.success && response.data) {
        savedSettings.value = response.data
        draftDomain.value = response.data.tienda_dominio ?? ''
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar la configuración'
    } finally {
      isLoading.value = false
    }
  }

  async function saveDomain(): Promise<boolean> {
    isSaving.value = true
    error.value = null
    try {
      const domain = draftDomain.value.trim() || null
      const response = await domainApi.updateDomain(domain)
      if (response.success && response.data) {
        savedSettings.value = response.data
        draftDomain.value = response.data.tienda_dominio ?? ''
        verificationResult.value = null
      }
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al guardar el dominio'
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function verifyDns(): Promise<boolean> {
    isVerifying.value = true
    error.value = null
    try {
      const response = await domainApi.verifyDns()
      if (response.success && response.data) {
        verificationResult.value = response.data
        savedSettings.value.tienda_dominio_verificado =
          response.data.tienda_dominio_verificado
      }
      return response.data?.dns_configured ?? false
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al verificar DNS'
      return false
    } finally {
      isVerifying.value = false
    }
  }

  return {
    savedSettings,
    draftDomain,
    isLoading,
    isSaving,
    isVerifying,
    error,
    verificationResult,
    hasChanges,
    fetchSettings,
    saveDomain,
    verifyDns
  }
})
