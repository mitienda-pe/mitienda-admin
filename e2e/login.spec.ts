import { test, expect } from '@playwright/test'

// Login tests do NOT use stored auth state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login', () => {
  test('muestra formulario de login', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button:has-text("Iniciar Sesión")')).toBeVisible()
  })

  test('valida password minimo 8 caracteres', async ({ page }) => {
    await page.goto('/login')

    await page.locator('#email').fill('test@example.com')
    await page.locator('#password input').fill('short')
    await page.locator('button:has-text("Iniciar Sesión")').click()

    await expect(page.locator('text=al menos 8 caracteres')).toBeVisible({ timeout: 3000 })
  })

  test('muestra error con credenciales invalidas', async ({ page }) => {
    await page.goto('/login')

    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password input').fill('wrongpassword123')
    await page.locator('button:has-text("Iniciar Sesión")').click()

    // Wait for API response and error display (could be "Credenciales", "Error de conexión", etc)
    await expect(
      page.locator('.p-message-error, .p-message-warn').first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('login exitoso redirige a dashboard o store-selection', async ({ page }) => {
    await page.goto('/login')

    await page.locator('#email').fill(process.env.TEST_EMAIL || 'carlos@mitienda.pe')
    await page.locator('#password input').fill(process.env.TEST_PASSWORD || 'hNhUuP8axJZgSLR')
    await page.locator('button:has-text("Iniciar Sesión")').click()

    await page.waitForURL((url) => {
      const path = url.pathname
      return path === '/dashboard' || path === '/store-selection' || path.startsWith('/admin')
    }, { timeout: 15000 })

    const url = page.url()
    expect(
      url.includes('/dashboard') || url.includes('/store-selection') || url.includes('/admin')
    ).toBeTruthy()
  })

  test('redirige a login si no autenticado', async ({ page }) => {
    await page.goto('/products')
    await page.waitForURL('**/login', { timeout: 5000 })
  })

  test('muestra enlace a recuperar contrasena', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('a:has-text("Olvidaste")')).toBeVisible()
  })

  test('muestra botones de login social', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('button:has-text("Google")')).toBeVisible()
    await expect(page.locator('button:has-text("Facebook")')).toBeVisible()
  })
})
