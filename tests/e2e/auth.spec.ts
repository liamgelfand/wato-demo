import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /^wato$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /challenges to do/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/\/register/)
  })
})
