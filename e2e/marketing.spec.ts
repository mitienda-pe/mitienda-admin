import { test, expect } from '@playwright/test'

test.describe('Marketing - Promociones', () => {
  test('lista de promociones carga', async ({ page }) => {
    await page.goto('/marketing/promotions')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Promociones")').first()).toBeVisible({ timeout: 10000 })
  })

  test('lista de combos carga', async ({ page }) => {
    await page.goto('/marketing/combos')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Combos")').first()).toBeVisible({ timeout: 10000 })
  })

  test('programa de lealtad carga', async ({ page }) => {
    await page.goto('/marketing/loyalty')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Lealtad|Fidelización|Loyalty/').first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Marketing - Upsales', () => {
  test('lista de upsales carga', async ({ page }) => {
    await page.goto('/marketing/upsales')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/Upsale|Venta cruzada|Sugeridos/').first()).toBeVisible({ timeout: 10000 })
  })
})
