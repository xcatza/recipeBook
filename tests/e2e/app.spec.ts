import { test, expect } from '@playwright/test'

test('home page renders with title and import button', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('My Recipes')
  await expect(page.locator('a[href="/import"]')).toBeVisible()
})

test('import page has URL input form', async ({ page }) => {
  await page.goto('/import')
  await expect(page.locator('h1')).toHaveText('Import Recipe')
  await expect(page.locator('input[type="url"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('can navigate from home to import and back', async ({ page }) => {
  await page.goto('/')
  await page.click('a[href="/import"]')
  await expect(page).toHaveURL('/import')
  await page.click('a[href="/"]')
  await expect(page).toHaveURL('/')
})
