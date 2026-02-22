import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber'
import { Page, Browser, BrowserContext } from '@playwright/test'

export interface DareScoreWorld extends World {
  browser?: Browser
  context?: BrowserContext
  page?: Page
  challengeCreated?: boolean
  pointsCalculated?: boolean
  testChallenge?: any
  expectedPoints?: string
}

class CustomWorld extends World {
  constructor(options: IWorldOptions) {
    super(options)
  }
}

setWorldConstructor(CustomWorld)
