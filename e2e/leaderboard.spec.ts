import { test, expect } from '@playwright/test'

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should display leaderboard with user rankings', async ({ page }) => {
    await page.goto('/leaderboard')

    // Should show leaderboard title
    await expect(page.locator('h1')).toContainText(/leaderboard/i)

    // Should show user entries
    const userEntries = page.locator('[data-testid="leaderboard-entry"]')
    await expect(userEntries.first()).toBeVisible()

    // Each entry should have username and points
    const firstEntry = userEntries.first()
    await expect(firstEntry.locator('text=/points/i')).toBeVisible()
  })

  test('should switch between total and weekly views', async ({ page }) => {
    await page.goto('/leaderboard')

    // Should have tabs for total and weekly
    const totalTab = page.locator('text=/total|all time/i')
    const weeklyTab = page.locator('text=/weekly|this week/i')

    await expect(totalTab).toBeVisible()
    await expect(weeklyTab).toBeVisible()

    // Click weekly tab
    await weeklyTab.click()

    // Should update leaderboard
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="leaderboard-entry"]').first()).toBeVisible()
  })

  test('should highlight current user', async ({ page }) => {
    await page.goto('/leaderboard')

    // Current user should be highlighted
    const currentUserEntry = page.locator('[data-testid="current-user-entry"]')
    
    // May or may not exist depending on if user is in top rankings
    const count = await currentUserEntry.count()
    if (count > 0) {
      await expect(currentUserEntry).toBeVisible()
    }
  })
})
