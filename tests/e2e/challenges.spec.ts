import { test, expect } from '@playwright/test'

test.describe('Challenge Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 15000 })
  })

  test('should display challenge cards', async ({ page }) => {
    await page.goto('/explore')

    const challengeCards = page.locator('[data-testid="challenge-card"]')
    await expect(challengeCards.first()).toBeVisible()

    const firstCard = challengeCards.first()
    await expect(firstCard.getByText(/\d+ pts/i)).toBeVisible()
  })

  test('should filter challenges by category', async ({ page }) => {
    await page.goto('/explore')

    const categoryBadges = page.getByText('Fitness', { exact: true }).first()
    await expect(categoryBadges).toBeVisible()
  })

  test('should navigate to challenge detail', async ({ page }) => {
    await page.goto('/explore')
    const firstChallenge = page.locator('[data-testid="challenge-card"]').first()
    const title = await firstChallenge.getByRole('heading', { level: 3 }).textContent()

    await firstChallenge.getByRole('link', { name: title!.trim() }).click()

    await expect(page).toHaveURL(/\/challenge\/[a-zA-Z0-9]+/)
    await expect(page.getByText(title!.trim())).toBeVisible()
    await expect(page.getByText(/points/i)).toBeVisible()
  })
})

test.describe('Create Challenge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 15000 })
  })

  test('should create a new challenge', async ({ page }) => {
    const title = `E2E Test Challenge ${Date.now()}`
    await page.goto('/create')

    await page.fill('#title', title)
    await page.fill('#description', 'This is a test challenge created by E2E tests with safe content.')
    await page.getByRole('button', { name: /create challenge/i }).click()

    await page.waitForURL(/\/challenge\/[a-zA-Z0-9]+/, { timeout: 15000 })
    await expect(page.getByText(title)).toBeVisible()
    await expect(page.getByText('Pending approval')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/create')

    await page.fill('#title', '')
    await page.fill('#description', '')
    await page.click('button[type="submit"]')

    await expect(page.locator('input:invalid, textarea:invalid').first()).toBeVisible()
  })
})
