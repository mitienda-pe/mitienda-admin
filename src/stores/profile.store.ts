import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { profileApi } from '@/api/profile.api'
import type {
  UserProfile,
  UpdateProfileRequest,
  DocumentValidationRequest,
  DocumentValidationResponse,
  SocialProvider
} from '@/types/profile.types'

export const useProfileStore = defineStore('profile', () => {
  // State
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isValidatingDocument = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const documentValidation = ref<DocumentValidationResponse | null>(null)

  // Getters
  const hasProfile = computed(() => !!profile.value)

  const socialAccounts = computed(() => profile.value?.socialAccounts || [])

  const hasGoogleLinked = computed(() =>
    socialAccounts.value.some(acc => acc.provider === 'google')
  )

  const hasFacebookLinked = computed(() =>
    socialAccounts.value.some(acc => acc.provider === 'facebook')
  )

  const isDocumentVerified = computed(() => profile.value?.documentVerified || false)

  // Actions
  function clearMessages() {
    error.value = null
    successMessage.value = null
  }

  function clearDocumentValidation() {
    documentValidation.value = null
  }

  async function fetchProfile() {
    isLoading.value = true
    error.value = null

    try {
      const result = await profileApi.getProfile()
      if (result.success && result.data) {
        profile.value = result.data
      } else {
        error.value = result.message || 'Error al cargar el perfil'
      }
    } catch (err) {
      error.value = 'Error de conexión al cargar el perfil'
      console.error('Error fetching profile:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(data: UpdateProfileRequest) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await profileApi.updateProfile(data)
      if (result.success) {
        // Actualizar perfil local
        if (profile.value) {
          profile.value = { ...profile.value, ...data }
        }
        successMessage.value = result.message || 'Perfil actualizado correctamente'
        return { success: true }
      } else {
        error.value = result.message || 'Error al actualizar el perfil'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión al actualizar el perfil'
      console.error('Error updating profile:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function validateDocument(data: DocumentValidationRequest) {
    isValidatingDocument.value = true
    error.value = null
    documentValidation.value = null

    try {
      const result = await profileApi.validateDocument(data)
      if (result.success && result.data) {
        documentValidation.value = result.data
        return { success: true, data: result.data }
      } else {
        error.value = result.message || 'Error al validar el documento'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión al validar el documento'
      console.error('Error validating document:', err)
      return { success: false, error: error.value }
    } finally {
      isValidatingDocument.value = false
    }
  }

  async function linkSocialAccount(provider: SocialProvider, token: string) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await profileApi.linkSocialAccount(provider, token)
      if (result.success && result.data?.account) {
        // Agregar la cuenta a la lista local
        if (profile.value) {
          profile.value.socialAccounts = [
            ...(profile.value.socialAccounts || []),
            result.data.account
          ]
        }
        successMessage.value = result.data.message || 'Cuenta vinculada correctamente'
        return { success: true, account: result.data.account }
      } else {
        error.value = result.message || 'Error al vincular la cuenta'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión al vincular la cuenta'
      console.error('Error linking social account:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  async function unlinkSocialAccount(accountId: number) {
    isSaving.value = true
    error.value = null
    successMessage.value = null

    try {
      const result = await profileApi.unlinkSocialAccount(accountId)
      if (result.success) {
        // Remover la cuenta de la lista local
        if (profile.value?.socialAccounts) {
          profile.value.socialAccounts = profile.value.socialAccounts.filter(
            acc => acc.id !== accountId
          )
        }
        successMessage.value = result.message || 'Cuenta desvinculada correctamente'
        return { success: true }
      } else {
        error.value = result.message || 'Error al desvincular la cuenta'
        return { success: false, error: error.value }
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión al desvincular la cuenta'
      console.error('Error unlinking social account:', err)
      return { success: false, error: error.value }
    } finally {
      isSaving.value = false
    }
  }

  function getOAuthUrl(provider: SocialProvider): string {
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/profile/oauth/callback`
    return profileApi.getOAuthUrl(provider, redirectUri)
  }

  return {
    // State
    profile,
    isLoading,
    isSaving,
    isValidatingDocument,
    error,
    successMessage,
    documentValidation,

    // Getters
    hasProfile,
    socialAccounts,
    hasGoogleLinked,
    hasFacebookLinked,
    isDocumentVerified,

    // Actions
    clearMessages,
    clearDocumentValidation,
    fetchProfile,
    updateProfile,
    validateDocument,
    linkSocialAccount,
    unlinkSocialAccount,
    getOAuthUrl
  }
})
