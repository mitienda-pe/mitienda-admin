import { test, expect } from '@playwright/test'

test.describe('Configuracion de Tienda', () => {
  test('informacion de tienda carga', async ({ page }) => {
    await page.goto('/store/info')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Información|Tienda|Datos/').first()).toBeVisible({ timeout: 10000 })
  })

  test('configuracion de envios carga', async ({ page }) => {
    await page.goto('/shipping/rates')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Tarifas|Envío|Shipping/').first()).toBeVisible({ timeout: 10000 })
  })

  test('facturacion carga', async ({ page }) => {
    await page.goto('/billing/providers')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Facturación|Billing|Proveedor/').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Catalogo', () => {
  test('categorias carga', async ({ page }) => {
    await page.goto('/catalog/categories')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Categorías/').first()).toBeVisible({ timeout: 10000 })
  })

  test('marcas carga', async ({ page }) => {
    await page.goto('/catalog/brands')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Marcas/').first()).toBeVisible({ timeout: 10000 })
  })

  test('atributos carga', async ({ page }) => {
    await page.goto('/catalog/attributes')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Atributos/').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Contenido', () => {
  test('paginas carga', async ({ page }) => {
    await page.goto('/pages')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Páginas|Pages/').first()).toBeVisible({ timeout: 10000 })
  })

  test('blog posts carga', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Blog")').first()).toBeVisible({ timeout: 10000 })
  })
})
