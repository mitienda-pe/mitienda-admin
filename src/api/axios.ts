import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api.types'
import { notify } from '@/utils/toast'

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 30000
})

// Request interceptor - Agregar token a todas las peticiones
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Si estamos enviando FormData, eliminar Content-Type para que Axios lo configure automáticamente
    // y aumentar timeout para uploads de archivos grandes
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
      // 5 minutos para uploads de video (pueden ser archivos grandes)
      config.timeout = 300000
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Token refresh queue to handle concurrent 401s
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function clearAuthAndRedirect() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  localStorage.removeItem('selected_store')
  localStorage.removeItem('superadmin_info')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// Response interceptor - Manejo de errores y renovación de tokens
apiClient.interceptors.response.use(
  response => {
    // Normalizar respuesta de la API
    // La API usa { error: 0, message: "...", data: {...} }
    // Nosotros necesitamos { success: true, message: "...", data: {...} }
    if (response.data && typeof response.data.error !== 'undefined') {
      response.data = {
        success: response.data.error === 0,
        message: response.data.message,
        data: response.data.data,
        // Preservar campos adicionales como pagination, pager, meta, etc.
        ...Object.fromEntries(
          Object.entries(response.data).filter(
            ([key]) => !['error', 'message', 'data'].includes(key)
          )
        )
      }
    }
    return response
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 403 module access errors - show upgrade modal
    //
    // La API devuelve 403 con `module` por tres motivos distintos y los
    // distingue con `reason`: 'plan' (la tienda no lo contrató → subir de plan
    // lo resuelve), 'permission' (el dueño no le concedió el módulo a este
    // usuario → el upgrade no tiene nada que ver) y 'readonly' (lo tiene, pero
    // solo para mirar). El modal de upgrade solo aplica al primero.
    const responseData = error.response?.data as Record<string, unknown> | undefined
    if (error.response?.status === 403 && responseData?.module) {
      // Red de seguridad de los usuarios de solo lectura: las pantallas
      // esconden lo que pueden, pero son ~190 vistas con botones de borrar,
      // subidas de imagen y drag & drop. Lo que se escape llega acá y el
      // usuario recibe un motivo en vez de un fallo mudo.
      if (responseData.reason === 'readonly') {
        notify({
          severity: 'warn',
          summary: 'Solo lectura',
          detail: (responseData.message as string) ??
            'Tu usuario tiene acceso de solo lectura a este módulo.'
        })
        return Promise.reject(error)
      }

      if (responseData.reason === 'permission') {
        return Promise.reject(error)
      }
      import('@/stores/plan.store').then(({ usePlanStore }) => {
        const planStore = usePlanStore()
        const moduleCode = responseData.module as string
        const mod = planStore.modules.find((m: { code: string }) => m.code === moduleCode)
        planStore.showUpgradeModal(mod ?? null)
      })
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshTokenValue = localStorage.getItem('refresh_token')

      if (!refreshTokenValue || originalRequest.url?.includes('/auth/refresh')) {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise(resolve => {
          addRefreshSubscriber((newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshTokenValue }
        )

        const { access_token, refresh_token: newRefreshToken } = response.data.data

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', newRefreshToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }

        // Resolve all queued requests with the new token
        onTokenRefreshed(access_token)

        return apiClient(originalRequest)
      } catch (refreshError) {
        refreshSubscribers = []
        clearAuthAndRedirect()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
