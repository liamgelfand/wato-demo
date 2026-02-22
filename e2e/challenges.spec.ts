import { test, expect } from '@playwright/test'

test.describe('Challenge Feed', () => {
  // Run before each test - login
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should display challenge cards', async ({ page }) => {
    // Should see challenge cards
    const challengeCards = page.locator('[data-testid="challenge-card"]')
    await expect(challengeCards.first()).toBeVisible()

    // Each card should have title, description, points
    const firstCard = challengeCards.first()
    await expect(firstCard.locator('text=/points/i')).toBeVisible()
  })

  test('should filter challenges by category', async ({ page }) => {
    // Click filter button/select
    await page.click('text=/filter|category/i')

    // Select FITNESS category
    await page.click('text=/fitness/i')

    // Should show only fitness challenges
    await page.waitForLoadState('networkidle')
    const categoryBadges = page.locator('text=/FITNESS/')
    const count = await categoryBadges.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to challenge detail', async ({ page }) => {
    // Click on first challenge card
    const firstChallenge = page.locator('[data-testid="challenge-card"]').first()
    await firstChallenge.click()

    // Should be on challenge detail page
    await expect(page).toHaveURL(/\/challenge\/[a-zA-Z0-9]+/)

    // Should show challenge details
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=/points/i')).toBeVisible()
  })
})

test.describe('Create Challenge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should create a new challenge', async ({ page }) => {
    await page.goto('/create')

    // Fill in challenge form
    await page.fill('input[name="title"]', 'E2E Test Challenge')
    await page.fill('textarea[name="description"]', 'This is a test challenge created by E2E tests')
    
    // Select category
    await page.click('[name="category"]')
    await page.click('text=/fitness/i')

    // Select difficulty
    await page.click('[name="difficulty"]')
    await page.click('text=/medium/i')

    // Enter base points
    await page.fill('input[name="basePoints"]', '100')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to challenge detail or feed
    await page.waitForURL(/\/(challenge\/[a-zA-Z0-9]+|\?created=true)/)

    // Should show success message
    await expect(page.locator('text=/success|created/i')).toBeVisible()
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/create')

    // Try to submit without filling form
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i')).toBeVisible()
  })
})
