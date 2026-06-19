import { after } from 'next/server'

/** Run work after the response when inside a Next.js request; otherwise fire-and-forget. */
export function scheduleBackgroundWork(task: () => Promise<void>): void {
  try {
    after(task)
  } catch {
    void task().catch((error) => {
      console.error('Background task failed:', error)
    })
  }
}
