import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Listen to API responses for debugging
  page.on('response', (response) => {
    if (response.url().includes('/auth/') || response.status() >= 400) {
      console.log(`[API] ${response.status()} ${response.url()}`)
    }
  })

  // Navigate to login
  await page.goto('/login', { waitUntil: 'networkidle' })

  // Fill login form
  await page.locator('#email').fill(process.env.TEST_EMAIL || 'carlos@mitienda.pe')

  // PrimeVue Password: the actual input is nested
  await page.locator('#password input').fill(process.env.TEST_PASSWORD || 'aq6cgMbFXEjCKys')

  // Click submit
  await page.locator('button[type="submit"]:has-text("Iniciar Sesión")').click()

  // Wait a bit for the API call
  await page.waitForTimeout(3000)

  // Check if there's an error message
  const errorMsg = page.locator('.p-message-error, text=Error de conexión, text=Credenciales')
  if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
    const text = await errorMsg.textContent()
    console.log(`[LOGIN ERROR] ${text}`)

    // Retry once
    await page.locator('button[type="submit"]:has-text("Iniciar Sesión")').click()
  }

  // Wait for any post-login page
  await page.waitForURL((url) => {
    const path = url.pathname
    return (
      path === '/dashboard' ||
      path === '/store-selection' ||
      path.startsWith('/admin')
    )
  }, { timeout: 30000 })

  // If redirected to store-selection, pick the first store
  if (page.url().includes('/store-selection')) {
    await page.locator('[class*="card"], [class*="Card"]').first().click()
    await page.waitForURL('**/dashboard', { timeout: 15000 })
  }

  // Verify authenticated
  await expect(page).not.toHaveURL(/\/login/)

  // Save auth state
  await page.context().storageState({ path: authFile })
})
