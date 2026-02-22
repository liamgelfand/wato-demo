import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h1, h2')).toContainText(/sign in|login/i)
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill in login form
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to home page
    await expect(page).toHaveURL('/')
    
    // Should show challenge feed
    await expect(page.locator('h1')).toContainText(/challenges/i)
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/error|invalid|incorrect/i')).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/login')

    // Click signup link
    await page.click('text=/sign up|register/i')

    // Should be on signup page
    await expect(page).toHaveURL(/\/signup/)
  })
})
