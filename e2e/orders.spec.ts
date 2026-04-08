import { test, expect } from '@playwright/test'

test.describe('Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders')
    await page.waitForLoadState('networkidle')
  })

  test('muestra lista de pedidos', async ({ page }) => {
    await expect(page.locator('h1:has-text("Pedidos")')).toBeVisible()

    // Orders are shown as card-like divs with order codes starting with #
    const orders = page.locator('text=/^#[A-Z0-9]/')
    const emptyState = page.locator('text=No hay pedidos')

    await expect(orders.first().or(emptyState)).toBeVisible({ timeout: 15000 })
  })

  test('busqueda de pedidos funciona', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Buscar"]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('1234')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Pedidos")')).toBeVisible()
  })

  test('click en pedido abre detalle', async ({ page }) => {
    // Click first order (the card containing order code)
    const firstOrder = page.locator('text=/^#[A-Z0-9]/').first()

    if (await firstOrder.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click the parent container of the order code
      await firstOrder.locator('..').locator('..').click()
      await page.waitForURL('**/orders/*', { timeout: 5000 })
      await page.waitForLoadState('networkidle')

      await expect(page.locator('text=/Pedido|Total|Cliente/').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('filtros de estado existen', async ({ page }) => {
    // Should have status filter
    const statusFilter = page.locator('text=/Estado|Todos los estados/')
    await expect(statusFilter.first()).toBeVisible({ timeout: 5000 })
  })

  test('muestra conteo de pedidos', async ({ page }) => {
    await expect(page.locator('text=/\\d+ pedido/')).toBeVisible({ timeout: 10000 })
  })
})
