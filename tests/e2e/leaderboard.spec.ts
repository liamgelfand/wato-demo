import { test, expect } from '@playwright/test'

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'demo1@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { timeout: 15000 })
  })

  test('should display leaderboard with user rankings', async ({ page }) => {
    await page.goto('/leaderboard')

    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible()

    const userEntries = page.locator('[data-testid="leaderboard-entry"], [data-testid="current-user-entry"]')
    await expect(userEntries.first()).toBeVisible()
    await expect(userEntries.first().getByText(/points/i)).toBeVisible()
  })

  test('should switch between total and weekly views', async ({ page }) => {
    await page.goto('/leaderboard')

    const allTimeTab = page.getByRole('tab', { name: 'All Time' }).first()
    const weeklyTab = page.getByRole('tab', { name: 'This Week' }).first()

    await expect(allTimeTab).toBeVisible()
    await expect(weeklyTab).toBeVisible()

    await weeklyTab.click()

    await expect(page.locator('[data-testid="leaderboard-entry"], [data-testid="current-user-entry"]').first()).toBeVisible()
  })

  test('should switch between friends and public leaderboards', async ({ page }) => {
    await page.goto('/leaderboard')

    const friendsTab = page.getByRole('tab', { name: 'Friends' })
    const publicTab = page.getByRole('tab', { name: 'Public' })

    await expect(friendsTab).toBeVisible()
    await expect(publicTab).toBeVisible()

    await publicTab.click()
    await expect(page.getByText(/Community — All Time/i)).toBeVisible()
  })

  test('should highlight current user', async ({ page }) => {
    await page.goto('/leaderboard')

    const friendsPanel = page.getByRole('tabpanel').filter({ hasText: /Friends — All Time/i })
    const currentUserEntry = friendsPanel.getByTestId('current-user-entry')
    await expect(currentUserEntry).toBeVisible()
    await expect(currentUserEntry.getByText('You')).toBeVisible()
  })
})
