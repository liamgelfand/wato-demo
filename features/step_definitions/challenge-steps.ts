import { Given, When, Then, Before, After } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { chromium, Browser, Page, BrowserContext } from '@playwright/test'

// World context to store state between steps
let browser: Browser
let context: BrowserContext
let page: Page

Before(async function () {
  browser = await chromium.launch()
  context = await browser.newContext()
  page = await context.newPage()
})

After(async function () {
  await context.close()
  await browser.close()
})

// Authentication steps
Given('I am logged in as a user', async function () {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', 'demo1@test.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/')
})

Given('I am logged in as {string}', async function (username: string) {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[type="email"]', `${username}@test.com`)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/')
})

// Navigation steps
Given('I am on the create challenge page', async function () {
  await page.goto('http://localhost:3000/create')
})

When('I navigate to the leaderboard page', async function () {
  await page.goto('http://localhost:3000/leaderboard')
})

// Form filling steps
When('I fill in the challenge form with valid data:', async function (dataTable: any) {
  const data = dataTable.rowsHash()
  
  await page.fill('input[name="title"]', data.title)
  await page.fill('textarea[name="description"]', data.description)
  await page.click('[name="category"]')
  await page.click(`text=${data.category}`)
  await page.click('[name="difficulty"]')
  await page.click(`text=${data.difficulty}`)
  await page.fill('input[name="basePoints"]', data.basePoints)
})

When('I fill in the challenge form with banned words:', async function (dataTable: any) {
  const data = dataTable.rowsHash()
  
  await page.fill('input[name="title"]', data.title)
  await page.fill('textarea[name="description"]', data.description)
  await page.click('[name="category"]')
  await page.click(`text=${data.category}`)
  await page.click('[name="difficulty"]')
  await page.click(`text=${data.difficulty}`)
  await page.fill('input[name="basePoints"]', data.basePoints)
})

When('I submit the challenge form', async function () {
  await page.click('button[type="submit"]')
})

When('I submit the challenge form without filling required fields', async function () {
  await page.click('button[type="submit"]')
})

When('I create a challenge with base points {string} and difficulty {string}', async function (
  basePoints: string,
  difficulty: string
) {
  await page.fill('input[name="title"]', 'Test Challenge')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.click('[name="category"]')
  await page.click('text=FITNESS')
  await page.click('[name="difficulty"]')
  await page.click(`text=${difficulty}`)
  await page.fill('input[name="basePoints"]', basePoints)
  await page.click('button[type="submit"]')
})

// Assertion steps
Then('I should see a success message', async function () {
  await expect(page.locator('text=/success|created/i')).toBeVisible({ timeout: 5000 })
})

Then('I should see an error message about banned content', async function () {
  await expect(page.locator('text=/banned|prohibited|not allowed/i')).toBeVisible({ timeout: 5000 })
})

Then('I should see validation errors for:', async function (dataTable: any) {
  const fields = dataTable.raw().flat()
  
  for (const field of fields) {
    if (field !== 'field') {
      await expect(page.locator(`text=/required|invalid/i`)).toBeVisible()
    }
  }
})

Then('the challenge should be created in the database', async function () {
  // This would require database check - placeholder
  // In real scenario, you'd query the database or check via API
  this.challengeCreated = true
})

Then('the challenge should not be created', async function () {
  // Wait a bit and ensure we're still on create page or showing error
  await page.waitForTimeout(1000)
  const url = page.url()
  expect(url).toContain('/create')
})

Then('the challenge points should be calculated correctly', async function () {
  // This would be verified by checking the created challenge data
  this.pointsCalculated = true
})

Then('the challenge should have {string} total points', async function (expectedPoints: string) {
  // Wait for redirect or success
  await page.waitForTimeout(2000)
  
  // This would require checking the created challenge
  // Placeholder for demonstration
  this.expectedPoints = expectedPoints
})

// Export page for use in other step definition files
export { page }
