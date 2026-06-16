/**
 * @jest-environment node
 */
import type { User } from '@prisma/client'
import { prisma } from '@/lib/db'
import { POST } from '@/app/api/challenges/create/route'

const authState = { userId: '' }

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({
    user: {
      id: authState.userId,
      email: 'test@example.com',
      username: 'testuser',
    },
  })),
}))

const isDatabaseAvailable = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

describe('/api/challenges/create', () => {
  let testUser: User
  let dbAvailable = false

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      console.warn('⚠️  Test database not available - skipping API tests')
      return
    }

    testUser = await prisma.user.upsert({
      where: { email: 'test-challenge-api@example.com' },
      update: {},
      create: {
        email: 'test-challenge-api@example.com',
        username: `testuser_${Date.now()}`,
        name: 'Test User',
        password: 'hashed_password_placeholder',
      },
    })
    authState.userId = testUser.id
  })

  afterAll(async () => {
    if (dbAvailable && testUser) {
      try {
        await prisma.challenge.deleteMany({
          where: { creatorId: testUser.id },
        })
      } catch {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect()
  })

  it('should create a new challenge with valid data', async () => {
    if (!dbAvailable) return

    const validChallenge = {
      title: 'Integration Test Challenge',
      description: 'This is a test challenge for integration testing',
      category: 'FITNESS',
      difficulty: 3,
    }

    const request = new Request('http://localhost:3000/api/challenges/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validChallenge),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.title).toBe(validChallenge.title)
    expect(data.points).toBe(30)
  })

  it('should reject challenge with banned words', async () => {
    if (!dbAvailable) return

    const invalidChallenge = {
      title: 'Drinking Challenge',
      description: 'This contains alcohol',
      category: 'FUNNY',
      difficulty: 2,
    }

    const request = new Request('http://localhost:3000/api/challenges/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidChallenge),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(Array.isArray(data.errors)).toBe(true)
    expect(data.errors.length).toBeGreaterThan(0)
  })

  it('should reject challenge with invalid data', async () => {
    if (!dbAvailable) return

    const invalidChallenge = {
      title: 'A',
      description: 'Test',
      category: 'INVALID_CATEGORY',
      difficulty: 3,
    }

    const request = new Request('http://localhost:3000/api/challenges/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidChallenge),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
