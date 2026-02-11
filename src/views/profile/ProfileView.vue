<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-secondary">Mi Perfil</h1>
      <p class="text-secondary-500">Administra tu información personal y seguridad</p>
    </div>

    <!-- Mensajes -->
    <Message v-if="profileStore.error" severity="error" :closable="true" @close="profileStore.clearMessages" class="mb-4">
      {{ profileStore.error }}
    </Message>
    <Message v-if="profileStore.successMessage" severity="success" :closable="true" @close="profileStore.clearMessages" class="mb-4">
      {{ profileStore.successMessage }}
    </Message>

    <!-- Loading -->
    <div v-if="profileStore.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <div v-else class="space-y-6">
      <!-- Card: Información Personal -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-user text-primary"></i>
            <span>Información Personal</span>
          </div>
        </template>
        <template #content>
          <form @submit.prevent="handleUpdateProfile" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Nombre -->
              <div>
                <label for="name" class="block text-sm font-medium text-secondary-700 mb-2">
                  Nombre completo
                </label>
                <InputText
                  id="name"
                  v-model="profileForm.name"
                  class="w-full"
                  placeholder="Tu nombre"
                />
              </div>

              <!-- Email (readonly) -->
              <div>
                <label for="email" class="block text-sm font-medium text-secondary-700 mb-2">
                  Correo electrónico
                </label>
                <InputText
                  id="email"
                  :value="profileStore.profile?.email"
                  class="w-full"
                  disabled
                />
                <small class="text-secondary-500">El correo no puede ser modificado</small>
              </div>

              <!-- Teléfono -->
              <div>
                <label for="phone" class="block text-sm font-medium text-secondary-700 mb-2">
                  Teléfono
                </label>
                <InputText
                  id="phone"
                  v-model="profileForm.phone"
                  class="w-full"
                  placeholder="987654321"
                />
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <Button
                type="submit"
                label="Guardar cambios"
                icon="pi pi-check"
                :loading="profileStore.isSaving"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- Card: Documento de Identidad -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-id-card text-primary"></i>
            <span>Documento de Identidad</span>
            <Tag
              v-if="profileStore.isDocumentVerified"
              value="Verificado"
              severity="success"
              icon="pi pi-check-circle"
            />
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Tipo de documento -->
              <div>
                <label for="documentType" class="block text-sm font-medium text-secondary-700 mb-2">
                  Tipo de documento
                </label>
                <Dropdown
                  id="documentType"
                  v-model="documentForm.documentType"
                  :options="documentTypes"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar"
                  class="w-full"
                />
              </div>

              <!-- Número de documento -->
              <div>
                <label for="documentNumber" class="block text-sm font-medium text-secondary-700 mb-2">
                  Número de documento
                </label>
                <InputText
                  id="documentNumber"
                  v-model="documentForm.documentNumber"
                  class="w-full"
                  placeholder="12345678"
                />
              </div>

              <!-- Botón validar -->
              <div class="flex items-end">
                <Button
                  label="Validar con DeColecta"
                  icon="pi pi-search"
                  severity="secondary"
                  :loading="profileStore.isValidatingDocument"
                  :disabled="!documentForm.documentType || !documentForm.documentNumber"
                  @click="handleValidateDocument"
                />
              </div>
            </div>

            <!-- Resultado de validación -->
            <div v-if="profileStore.documentValidation" class="mt-4">
              <div v-if="profileStore.documentValidation.valid" class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center gap-2 mb-2">
                  <i class="pi pi-check-circle text-green-600"></i>
                  <span class="font-medium text-green-700">Documento verificado</span>
                </div>
                <div v-if="profileStore.documentValidation.data" class="text-sm text-green-600 space-y-1">
                  <p v-if="profileStore.documentValidation.data.nombreCompleto">
                    <strong>Nombre:</strong> {{ profileStore.documentValidation.data.nombreCompleto }}
                  </p>
                  <p v-if="profileStore.documentValidation.data.razonSocial">
                    <strong>Razón Social:</strong> {{ profileStore.documentValidation.data.razonSocial }}
                  </p>
                  <p v-if="profileStore.documentValidation.data.estado">
                    <strong>Estado:</strong> {{ profileStore.documentValidation.data.estado }}
                  </p>
                  <p v-if="profileStore.documentValidation.data.direccion">
                    <strong>Dirección:</strong> {{ profileStore.documentValidation.data.direccion }}
                  </p>
                </div>
                <div class="mt-3">
                  <Button
                    label="Guardar documento"
                    icon="pi pi-save"
                    size="small"
                    :loading="profileStore.isSaving"
                    @click="handleSaveDocument"
                  />
                </div>
              </div>
              <div v-else class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-center gap-2">
                  <i class="pi pi-times-circle text-red-600"></i>
                  <span class="text-red-700">{{ profileStore.documentValidation.message || 'No se pudo verificar el documento' }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Card: Cambiar Contraseña -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-lock text-primary"></i>
            <span>Cambiar Contraseña</span>
          </div>
        </template>
        <template #content>
          <p class="text-secondary-500 mb-4">
            Por seguridad, el cambio de contraseña se realiza mediante un enlace enviado a tu correo electrónico.
          </p>

          <Message v-if="passwordEmailSent" severity="success" :closable="true" @close="passwordEmailSent = false" class="mb-4">
            Hemos enviado un enlace a tu correo electrónico para cambiar tu contraseña.
          </Message>

          <Button
            label="Enviar enlace de cambio de contraseña"
            icon="pi pi-envelope"
            severity="warning"
            :loading="isSendingPasswordEmail"
            :disabled="!profileStore.profile?.email"
            @click="handleRequestPasswordChange"
          />
        </template>
      </Card>

      <!-- Card: Cuentas Vinculadas (Social Login) -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-share-alt text-primary"></i>
            <span>Cuentas Vinculadas</span>
          </div>
        </template>
        <template #subtitle>
          Vincula tu cuenta con Google o Facebook para iniciar sesión más rápido
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Google -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div class="flex items-center gap-3">
                <img src="@/assets/images/google-icon.svg" alt="Google" class="w-8 h-8" />
                <div>
                  <p class="font-medium">Google</p>
                  <p v-if="googleAccount" class="text-sm text-secondary-500">
                    {{ googleAccount.email }}
                  </p>
                  <p v-else class="text-sm text-secondary-500">No vinculada</p>
                </div>
              </div>
              <Button
                v-if="googleAccount"
                label="Desvincular"
                icon="pi pi-times"
                severity="danger"
                text
                :loading="profileStore.isSaving"
                @click="handleUnlinkAccount(googleAccount!.id)"
              />
              <Button
                v-else
                label="Vincular"
                icon="pi pi-link"
                severity="secondary"
                @click="handleLinkGoogle"
              />
            </div>

            <!-- Facebook -->
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div class="flex items-center gap-3">
                <img src="@/assets/images/facebook-icon.svg" alt="Facebook" class="w-8 h-8" />
                <div>
                  <p class="font-medium">Facebook</p>
                  <p v-if="facebookAccount" class="text-sm text-secondary-500">
                    {{ facebookAccount.email || facebookAccount.name }}
                  </p>
                  <p v-else class="text-sm text-secondary-500">No vinculada</p>
                </div>
              </div>
              <Button
                v-if="facebookAccount"
                label="Desvincular"
                icon="pi pi-times"
                severity="danger"
                text
                :loading="profileStore.isSaving"
                @click="handleUnlinkAccount(facebookAccount!.id)"
              />
              <Button
                v-else
                label="Vincular"
                icon="pi pi-link"
                severity="secondary"
                @click="handleLinkFacebook"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Dialog de confirmación para desvincular -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useProfileStore } from '@/stores/profile.store'
import { authApi } from '@/api/auth.api'
import type { DocumentType } from '@/types/profile.types'

import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

const confirm = useConfirm()
const toast = useToast()
const profileStore = useProfileStore()

// Forms
const profileForm = ref({
  name: '',
  phone: ''
})

const documentForm = ref({
  documentType: '' as DocumentType | '',
  documentNumber: ''
})

const isSendingPasswordEmail = ref(false)
const passwordEmailSent = ref(false)

// Options
const documentTypes = [
  { label: 'DNI', value: 'DNI' },
  { label: 'Carnet de Extranjería', value: 'CE' },
  { label: 'RUC', value: 'RUC' },
  { label: 'Pasaporte', value: 'PASSPORT' }
]

// Computed
const googleAccount = computed(() =>
  profileStore.socialAccounts.find(acc => acc.provider === 'google')
)

const facebookAccount = computed(() =>
  profileStore.socialAccounts.find(acc => acc.provider === 'facebook')
)

// Watch profile changes to update form
watch(() => profileStore.profile, (newProfile) => {
  if (newProfile) {
    profileForm.value.name = newProfile.name || ''
    profileForm.value.phone = newProfile.phone || ''
    documentForm.value.documentType = newProfile.documentType || ''
    documentForm.value.documentNumber = newProfile.documentNumber || ''
  }
}, { immediate: true })

// Handlers
async function handleUpdateProfile() {
  const result = await profileStore.updateProfile({
    name: profileForm.value.name,
    phone: profileForm.value.phone
  })

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: 'Perfil actualizado',
      detail: 'Tu información ha sido guardada',
      life: 3000
    })
  }
}

async function handleValidateDocument() {
  if (!documentForm.value.documentType || !documentForm.value.documentNumber) return

  await profileStore.validateDocument({
    documentType: documentForm.value.documentType as DocumentType,
    documentNumber: documentForm.value.documentNumber
  })
}

async function handleSaveDocument() {
  const result = await profileStore.updateProfile({
    documentType: documentForm.value.documentType as DocumentType,
    documentNumber: documentForm.value.documentNumber
  })

  if (result.success) {
    profileStore.clearDocumentValidation()
    toast.add({
      severity: 'success',
      summary: 'Documento guardado',
      detail: 'Tu documento ha sido verificado y guardado',
      life: 3000
    })
  }
}

async function handleRequestPasswordChange() {
  const email = profileStore.profile?.email
  if (!email) return

  isSendingPasswordEmail.value = true

  try {
    await authApi.forgotPassword({ email })
    passwordEmailSent.value = true
    toast.add({
      severity: 'success',
      summary: 'Enlace enviado',
      detail: 'Revisa tu correo electrónico para cambiar tu contraseña',
      life: 5000
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo enviar el enlace. Intenta de nuevo.',
      life: 5000
    })
  } finally {
    isSendingPasswordEmail.value = false
  }
}

function handleLinkGoogle() {
  const url = profileStore.getOAuthUrl('google')
  window.location.href = url
}

function handleLinkFacebook() {
  const url = profileStore.getOAuthUrl('facebook')
  window.location.href = url
}

function handleUnlinkAccount(accountId: number) {
  confirm.require({
    message: '¿Estás seguro de desvincular esta cuenta?',
    header: 'Confirmar desvinculación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const result = await profileStore.unlinkSocialAccount(accountId)
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Cuenta desvinculada',
          detail: 'La cuenta ha sido desvinculada correctamente',
          life: 3000
        })
      }
    }
  })
}

// Lifecycle
onMounted(() => {
  profileStore.fetchProfile()
})
</script>
