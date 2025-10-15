<template>
  <div class="superadmin-debug p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">🔍 Debug Super-Admin</h1>

    <!-- Estado Actual -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Estado Actual</h2>

      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <span class="font-medium">Usuario:</span>
          <span>{{ authStore.user?.name }} (ID: {{ authStore.user?.id }})</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="font-medium">Email:</span>
          <span>{{ authStore.user?.email }}</span>
        </div>

        <div class="flex items-center gap-2">
          <span class="font-medium">Es SuperAdmin:</span>
          <span
            :class="authStore.isSuperAdmin ? 'text-green-600 font-bold' : 'text-red-600'"
          >
            {{ authStore.isSuperAdmin ? '✅ SÍ' : '❌ NO' }}
          </span>
        </div>

        <div v-if="authStore.isSuperAdmin" class="mt-4 p-4 bg-green-50 rounded">
          <p class="font-medium text-green-800 mb-2">Información de SuperAdmin:</p>
          <pre class="text-sm">{{ JSON.stringify(authStore.superAdminInfo, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- LocalStorage -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">LocalStorage</h2>
      <div class="space-y-2 text-sm">
        <div>
          <strong>superadmin_info:</strong>
          <pre class="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">{{ localStorageData.superadmin_info }}</pre>
        </div>
        <div>
          <strong>access_token:</strong>
          <pre class="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">{{ localStorageData.access_token?.substring(0, 100) }}...</pre>
        </div>
      </div>
    </div>

    <!-- Acciones -->
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold mb-4">Acciones</h2>

      <div class="space-y-3">
        <button
          @click="recheckSuperAdmin"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {{ loading ? 'Verificando...' : '🔄 Re-verificar SuperAdmin' }}
        </button>

        <button
          @click="clearAndReload"
          class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🗑️ Limpiar Cache y Recargar
        </button>

        <button
          v-if="authStore.isSuperAdmin"
          @click="goToStores"
          class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🏪 Ir a Listado de Tiendas
        </button>
      </div>

      <!-- Instrucciones SQL -->
      <div v-if="!authStore.isSuperAdmin" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p class="font-semibold text-yellow-800 mb-2">⚠️ Para convertir este usuario en SuperAdmin:</p>
        <pre class="text-sm bg-yellow-100 p-3 rounded overflow-x-auto">INSERT INTO superadministradores (usuario_id, parner_id, superadmintipo_id)
VALUES ({{ authStore.user?.id }}, 1, 1);</pre>
        <p class="text-sm text-yellow-700 mt-2">
          Ejecuta este SQL en la base de datos <code class="bg-yellow-200 px-1 rounded">mitienda</code>
          y luego haz click en "Re-verificar SuperAdmin"
        </p>
      </div>
    </div>

    <!-- Respuesta del Último Check -->
    <div v-if="lastCheckResponse" class="bg-white rounded-lg shadow p-6 mt-6">
      <h2 class="text-lg font-semibold mb-4">Última Respuesta del API</h2>
      <pre class="text-sm bg-gray-100 p-4 rounded overflow-x-auto">{{ JSON.stringify(lastCheckResponse, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { adminApi } from '@/api/admin.api'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const lastCheckResponse = ref<any>(null)
const localStorageData = ref({
  superadmin_info: '',
  access_token: ''
})

onMounted(() => {
  loadLocalStorageData()
})

function loadLocalStorageData() {
  localStorageData.value.superadmin_info = localStorage.getItem('superadmin_info') || 'null'
  localStorageData.value.access_token = localStorage.getItem('access_token') || 'null'
}

async function recheckSuperAdmin() {
  loading.value = true
  lastCheckResponse.value = null

  try {
    const response = await adminApi.checkSuperAdmin()
    lastCheckResponse.value = response

    // Forzar actualización del estado
    await authStore.checkSuperAdmin()
    loadLocalStorageData()

    alert(
      response.data?.is_superadmin
        ? '✅ Usuario ES SuperAdmin'
        : '❌ Usuario NO es SuperAdmin'
    )
  } catch (error: any) {
    lastCheckResponse.value = error.response?.data || { error: error.message }
    alert('❌ Error al verificar: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

function clearAndReload() {
  if (confirm('¿Limpiar todo el localStorage y recargar?')) {
    localStorage.clear()
    window.location.href = '/login'
  }
}

function goToStores() {
  router.push('/admin/stores')
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
