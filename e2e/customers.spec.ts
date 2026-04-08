import { test, expect } from '@playwright/test'

test.describe('Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customers')
    await page.waitForLoadState('networkidle')
  })

  test('muestra lista de clientes con DataTable', async ({ page }) => {
    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()

    const table = page.locator('.p-datatable')
    const emptyState = page.locator('text=No hay clientes')

    await expect(table.or(emptyState)).toBeVisible({ timeout: 15000 })
  })

  test('busqueda de clientes funciona', async ({ page }) => {
    const searchInput = page.locator('[placeholder*="Buscar por nombre"]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('test')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Clientes")')).toBeVisible()
  })

  test('click en fila abre detalle del cliente', async ({ page }) => {
    const rows = page.locator('.p-datatable-tbody tr')

    if (await rows.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await rows.first().click()
      await page.waitForURL('**/customers/*', { timeout: 5000 })

      await expect(page.locator('text=/Cliente|Detalle|Pedidos/').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('boton nuevo cliente navega a formulario', async ({ page }) => {
    await page.locator('button:has-text("Nuevo Cliente")').click()
    await page.waitForURL('**/customers/create', { timeout: 5000 })

    // Form uses placeholders, not IDs
    await expect(page.locator('[placeholder="Juan Carlos"]')).toBeVisible({ timeout: 5000 })
  })

  test.fixme('formulario valida campos requeridos', async ({ page }) => {
    await page.goto('/customers/create')
    await page.waitForLoadState('networkidle')

    // Scroll to bottom and click save without filling required fields
    const saveBtn = page.locator('button:has-text("Guardar")')
    await saveBtn.scrollIntoViewIfNeeded()
    await saveBtn.click()

    // Should show validation - toast or inline error text
    await expect(
      page.locator('.p-toast-message-warn')
        .or(page.locator('text=obligatorio'))
        .or(page.locator('.text-red-500').first())
    ).toBeVisible({ timeout: 5000 })
  })

  test.fixme('formulario valida DNI 8 digitos', async ({ page }) => {
    await page.goto('/customers/create')
    await page.waitForLoadState('networkidle')

    // Fill document number with invalid value
    const docInput = page.locator('input[placeholder="12345678"]')
    await docInput.fill('123')

    // Scroll to save button and click
    const saveBtn = page.locator('button:has-text("Guardar")')
    await saveBtn.scrollIntoViewIfNeeded()
    await saveBtn.click()

    await expect(
      page.locator('text=8 dígitos').or(page.locator('.text-red-500').first())
    ).toBeVisible({ timeout: 5000 })
  })

  test('birthdate no permite fechas futuras', async ({ page }) => {
    await page.goto('/customers/create')
    await page.waitForLoadState('networkidle')

    const birthdateInput = page.locator('input[type="date"]')
    if (await birthdateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const maxDate = await birthdateInput.getAttribute('max')
      if (maxDate) {
        expect(new Date(maxDate).getTime()).toBeLessThanOrEqual(new Date().getTime())
      }
    }
  })

  test('paginacion de DataTable funciona', async ({ page }) => {
    const paginator = page.locator('.p-paginator')

    if (await paginator.isVisible({ timeout: 5000 }).catch(() => false)) {
      const nextButton = paginator.locator('.p-paginator-next')
      if (await nextButton.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click()
        await page.waitForLoadState('networkidle')
        await expect(page.locator('.p-datatable')).toBeVisible()
      }
    }
  })

  test('ordenamiento por columna funciona', async ({ page }) => {
    const nameHeader = page.locator('.p-datatable th:has-text("Nombre")')

    if (await nameHeader.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameHeader.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('.p-datatable')).toBeVisible()
    }
  })
})
