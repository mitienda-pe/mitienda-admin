import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

// Mock the API modules
vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    getStores: vi.fn(),
    selectStore: vi.fn(),
    logout: vi.fn(),
  }
}))

vi.mock('@/api/admin.api', () => ({
  adminApi: {
    checkSuperAdmin: vi.fn(),
  }
}))

// Helper to create a valid JWT with given exp
function createJWT(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: '1', exp }))
  return `${header}.${payload}.signature`
}

describe('auth.store - restoreSession', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('restores session from valid localStorage data', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    const token = createJWT(futureExp)
    const user = { id: 1, name: 'Test User', email: 'test@test.com' }

    localStorage.setItem('access_token', token)
    localStorage.setItem('refresh_token', 'refresh123')
    localStorage.setItem('user', JSON.stringify(user))

    const store = useAuthStore()
    store.restoreSession()

    expect(store.accessToken).toBe(token)
    expect(store.refreshToken).toBe('refresh123')
    expect(store.user).toEqual(user)
  })

  it('clears session when token is expired', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
    const token = createJWT(pastExp)
    const user = { id: 1, name: 'Test User', email: 'test@test.com' }

    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))

    const store = useAuthStore()
    store.restoreSession()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('clears session when localStorage user data is corrupted', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const token = createJWT(futureExp)

    localStorage.setItem('access_token', token)
    localStorage.setItem('user', '{invalid json}}}')

    const store = useAuthStore()
    store.restoreSession()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('does nothing when no token in localStorage', () => {
    const store = useAuthStore()
    store.restoreSession()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
  })

  it('does nothing when no user in localStorage', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    localStorage.setItem('access_token', createJWT(futureExp))

    const store = useAuthStore()
    store.restoreSession()

    expect(store.accessToken).toBeNull()
  })

  it('restores selected store from localStorage', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const token = createJWT(futureExp)
    const user = { id: 1, name: 'Test', email: 'test@test.com' }
    const selectedStore = { id: 42, name: 'Mi Tienda' }

    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('selected_store', JSON.stringify(selectedStore))

    const store = useAuthStore()
    store.restoreSession()

    expect(store.selectedStore).toEqual(selectedStore)
  })

  it('restores superadmin info from localStorage', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600
    const token = createJWT(futureExp)
    const user = { id: 1, name: 'Admin', email: 'admin@test.com' }
    const superAdminInfo = { is_superadmin: true }

    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('superadmin_info', JSON.stringify(superAdminInfo))

    const store = useAuthStore()
    store.restoreSession()

    expect(store.isSuperAdmin).toBe(true)
  })

  it('clears session when token has invalid format', () => {
    localStorage.setItem('access_token', 'not-a-jwt')
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test', email: 'a@b.com' }))

    const store = useAuthStore()
    store.restoreSession()

    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})

describe('auth.store - logout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('clears all state and localStorage on logout', async () => {
    const store = useAuthStore()

    // Set some state
    store.accessToken = 'token123'
    store.refreshToken = 'refresh123'
    store.user = { id: 1, name: 'Test', email: 'test@test.com' } as any
    localStorage.setItem('access_token', 'token123')
    localStorage.setItem('refresh_token', 'refresh123')
    localStorage.setItem('user', '{}')
    localStorage.setItem('selected_store', '{}')
    localStorage.setItem('superadmin_info', '{}')
    localStorage.setItem('impersonation_context', '{}')

    await store.logout()

    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.selectedStore).toBeNull()
    expect(store.superAdminInfo).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('selected_store')).toBeNull()
    expect(localStorage.getItem('superadmin_info')).toBeNull()
    expect(localStorage.getItem('impersonation_context')).toBeNull()
  })
})
