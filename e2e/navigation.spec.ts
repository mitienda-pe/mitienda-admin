import { test, expect } from '@playwright/test'

test.describe('Navegacion y Layout', () => {
  test('sidebar muestra modulos principales', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Verify key sidebar items are visible (they can be <a>, <button>, or <div>)
    await expect(page.getByText('Dashboard').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Clientes').first()).toBeVisible()
    await expect(page.getByText('Ventas').first()).toBeVisible()
    await expect(page.getByText('Marketing').first()).toBeVisible()
  })

  test('pagina 404 para rutas invalidas', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe-12345')

    await expect(page.locator('text=404')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=no encontrada')).toBeVisible()
  })

  test('navegar entre modulos mantiene sesion', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 })

    await page.goto('/customers')
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible({ timeout: 10000 })

    await page.goto('/dashboard')
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 })
  })
})
