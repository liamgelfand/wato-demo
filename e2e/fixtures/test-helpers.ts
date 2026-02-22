import { Page } from '@playwright/test'

/**
 * Helper functions for E2E tests
 */

export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/')
}

export async function createTestChallenge(
  page: Page,
  title: string,
  description: string,
  category: string = 'FITNESS',
  difficulty: string = 'MEDIUM',
  basePoints: string = '100'
) {
  await page.goto('/create')
  await page.fill('input[name="title"]', title)
  await page.fill('textarea[name="description"]', description)
  await page.click(`[name="category"]`)
  await page.click(`text=${category}`)
  await page.click(`[name="difficulty"]`)
  await page.click(`text=${difficulty}`)
  await page.fill('input[name="basePoints"]', basePoints)
  await page.click('button[type="submit"]')
}

export async function waitForToast(page: Page, message?: string) {
  if (message) {
    await page.waitForSelector(`text=${message}`)
  } else {
    await page.waitForSelector('[data-sonner-toast]')
  }
}
