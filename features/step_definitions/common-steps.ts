import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { page } from './challenge-steps'

// Common steps that can be reused across features

Given('there is a challenge {string} worth {string} points', async function (
  title: string,
  points: string
) {
  // This would create a challenge via API or database seeding
  // For now, placeholder
  this.testChallenge = { title, points }
})

Given('I am viewing the challenge {string}', async function (title: string) {
  // Navigate to challenge - would need to look up ID
  // Placeholder navigation
  await page.goto('http://localhost:3000/')
  await page.click(`text=${title}`)
})

When('I click {string}', async function (buttonText: string) {
  await page.click(`text=${buttonText}`)
})

Then('I should be redirected to the attempt page', async function () {
  await expect(page).toHaveURL(/\/attempt\/[a-zA-Z0-9]+/)
})

Then('my entry {string} should be highlighted', async function (username: string) {
  const userEntry = page.locator(`[data-testid="current-user-entry"]`)
  await expect(userEntry).toBeVisible()
})

Then('I should see {string} in the rankings', async function (username: string) {
  await expect(page.locator(`text=${username}`)).toBeVisible()
})

Then('I should not see {string} in the rankings', async function (username: string) {
  await expect(page.locator(`text=${username}`)).not.toBeVisible()
})
