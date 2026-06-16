/**
 * @jest-environment node
 */
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

const isDatabaseAvailable = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

describe('User Database Operations', () => {
  const testEmail = `test-${Date.now()}@example.com`
  let createdUserId: string
  let dbAvailable = false

  beforeAll(async () => {
    dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      console.warn('⚠️  Test database not available - skipping database tests')
    }
  })

  afterAll(async () => {
    if (createdUserId && dbAvailable) {
      try {
        await prisma.user.delete({ where: { id: createdUserId } })
      } catch {
        // Ignore cleanup errors
      }
    }
    await prisma.$disconnect()
  })

  it('should create a new user', async () => {
    if (!dbAvailable) return

    const hashedPassword = await bcrypt.hash('testpassword123', 10)

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: `testuser_${Date.now()}`,
        name: 'Test User',
        password: hashedPassword,
      },
    })

    createdUserId = user.id

    expect(user).toHaveProperty('id')
    expect(user.email).toBe(testEmail)
    expect(user.role).toBe('USER')
  })

  it('should find user by email', async () => {
    if (!dbAvailable) return

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    expect(user).not.toBeNull()
    expect(user?.email).toBe(testEmail)
  })

  it('should update user profile', async () => {
    if (!dbAvailable) return

    const updatedUser = await prisma.user.update({
      where: { id: createdUserId },
      data: {
        name: 'Updated Test User',
      },
    })

    expect(updatedUser.name).toBe('Updated Test User')
  })

  it('should enforce unique email constraint', async () => {
    if (!dbAvailable) return

    await expect(
      prisma.user.create({
        data: {
          email: testEmail,
          username: `anotheruser_${Date.now()}`,
          name: 'Another User',
          password: 'hashed_password_placeholder',
        },
      })
    ).rejects.toThrow()
  })
})
