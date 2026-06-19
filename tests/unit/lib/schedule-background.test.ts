jest.mock('next/server', () => ({
  after: jest.fn((task: () => Promise<void>) => {
    throw new Error('outside request scope')
  }),
}))

import { after } from 'next/server'
import { scheduleBackgroundWork } from '@/lib/schedule-background'

describe('scheduleBackgroundWork', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('runs the task directly when after() is unavailable', async () => {
    const task = jest.fn().mockResolvedValue(undefined)

    scheduleBackgroundWork(task)

    expect(after).toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(task).toHaveBeenCalled()
  })
})
