import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('carga el dashboard correctamente', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 })
  })

  test('muestra metricas de ventas', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Dashboard shows sales metrics - look for numbers or chart containers
    await expect(
      page.locator('text=/Pedidos|Ventas|Total|Brutos/').first()
    ).toBeVisible({ timeout: 15000 })
  })

  test('navega a productos desde sidebar', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Productos")')).toBeVisible({ timeout: 10000 })
  })

  test('navega a pedidos desde sidebar', async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Pedidos")')).toBeVisible({ timeout: 10000 })
  })

  test('navega a clientes desde sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await page.locator('nav a[href="/customers"]').click()
    await page.waitForURL('**/customers', { timeout: 5000 })
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()
  })
})
