/**
 * Integration test for health check API
 * Tests the actual API route without mocking
 */
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  it('should return health status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data.status).toBe('ok')
  })

  it('should check database connection', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('database')
    expect(['connected', 'disconnected']).toContain(data.database)
  })
})
