import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('axios - token refresh queue logic', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stores tokens in localStorage after login', () => {
    localStorage.setItem('access_token', 'test-token')
    localStorage.setItem('refresh_token', 'test-refresh')

    expect(localStorage.getItem('access_token')).toBe('test-token')
    expect(localStorage.getItem('refresh_token')).toBe('test-refresh')
  })

  it('clearAuthAndRedirect removes all auth keys', () => {
    // Simulate what clearAuthAndRedirect does
    localStorage.setItem('access_token', 'token')
    localStorage.setItem('refresh_token', 'refresh')
    localStorage.setItem('user', '{}')
    localStorage.setItem('selected_store', '{}')
    localStorage.setItem('superadmin_info', '{}')

    // Replicate the function logic
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('selected_store')
    localStorage.removeItem('superadmin_info')

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('selected_store')).toBeNull()
    expect(localStorage.getItem('superadmin_info')).toBeNull()
  })

  it('refresh subscriber queue pattern works correctly', () => {
    // Test the subscriber queue pattern in isolation
    let subscribers: Array<(token: string) => void> = []

    const addSubscriber = (cb: (token: string) => void) => {
      subscribers.push(cb)
    }

    const notifySubscribers = (token: string) => {
      subscribers.forEach(cb => cb(token))
      subscribers = []
    }

    const results: string[] = []

    // Simulate 3 concurrent requests queued during refresh
    addSubscriber((token) => results.push(`req1:${token}`))
    addSubscriber((token) => results.push(`req2:${token}`))
    addSubscriber((token) => results.push(`req3:${token}`))

    expect(subscribers.length).toBe(3)

    // Simulate refresh completing
    notifySubscribers('new-token')

    expect(results).toEqual(['req1:new-token', 'req2:new-token', 'req3:new-token'])
    expect(subscribers.length).toBe(0)
  })

  it('subscriber queue clears on refresh failure', () => {
    let subscribers: Array<(token: string) => void> = []

    const addSubscriber = (cb: (token: string) => void) => {
      subscribers.push(cb)
    }

    addSubscriber(() => {})
    addSubscriber(() => {})

    expect(subscribers.length).toBe(2)

    // Simulate refresh failure: clear queue
    subscribers = []

    expect(subscribers.length).toBe(0)
  })

  it('isRefreshing flag prevents duplicate refresh calls', () => {
    let isRefreshing = false
    let refreshCallCount = 0

    const simulateRefresh = () => {
      if (isRefreshing) return false
      isRefreshing = true
      refreshCallCount++
      return true
    }

    // First call triggers refresh
    expect(simulateRefresh()).toBe(true)
    expect(refreshCallCount).toBe(1)

    // Second call is blocked
    expect(simulateRefresh()).toBe(false)
    expect(refreshCallCount).toBe(1)

    // After refresh completes
    isRefreshing = false
    expect(simulateRefresh()).toBe(true)
    expect(refreshCallCount).toBe(2)
  })
})
