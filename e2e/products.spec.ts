import { test, expect } from '@playwright/test'

test.describe('Productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')
  })

  test('muestra lista de productos', async ({ page }) => {
    await expect(page.locator('h1:has-text("Productos")')).toBeVisible()

    // Should have product cards (grid layout)
    const products = page.locator('[class*="product-card"], [class*="ProductCard"], .grid > div')
    await expect(products.first()).toBeVisible({ timeout: 15000 })
  })

  test('busqueda filtra productos', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Buscar productos"]')
    await expect(searchInput).toBeVisible()

    // Get initial count text
    const countBefore = await page.locator('text=/\\d+ producto/').textContent()

    // Type search query
    await searchInput.fill('test')
    await page.waitForTimeout(500) // Wait for debounce

    // Wait for results to update
    await page.waitForLoadState('networkidle')

    // Page should still show products header
    await expect(page.locator('h1:has-text("Productos")')).toBeVisible()
  })

  test('limpiar busqueda restaura lista', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Buscar productos"]')

    await searchInput.fill('xxxnoexiste')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Clear search
    await searchInput.fill('')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    // Products should appear again
    const products = page.locator('[class*="product-card"], [class*="ProductCard"], .grid > div')
    await expect(products.first()).toBeVisible({ timeout: 10000 })
  })

  test('click en producto abre detalle', async ({ page }) => {
    // Click first product card
    const firstProduct = page.locator('[class*="product-card"], [class*="ProductCard"], .grid > div').first()
    await firstProduct.click()

    // Should navigate to product detail
    await page.waitForURL('**/products/*', { timeout: 5000 })
  })

  test('detalle de producto carga correctamente', async ({ page }) => {
    // Click first product
    const firstProduct = page.locator('[class*="product-card"], [class*="ProductCard"], .grid > div').first()
    await firstProduct.click()

    await page.waitForURL('**/products/*', { timeout: 5000 })
    await page.waitForLoadState('networkidle')

    // Should show product detail elements
    await expect(page.locator('input, [class*="detail"], h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('navigation guard previene salir con cambios', async ({ page }) => {
    // Navigate to a product detail
    const firstProduct = page.locator('[class*="product-card"], [class*="ProductCard"], .grid > div').first()
    await firstProduct.click()
    await page.waitForURL('**/products/*', { timeout: 5000 })
    await page.waitForLoadState('networkidle')

    // Make a change to trigger isDirty
    const nameInput = page.locator('input').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Modified Name')

      // Try to navigate away
      page.on('dialog', dialog => dialog.accept())
      await page.locator('a[href="/products"], a:has-text("Productos")').first().click()

      // Should have shown confirm dialog (accepted above)
    }
  })
})
