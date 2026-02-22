/**
 * Database integration tests
 * Tests Prisma queries and database operations
 */
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

describe('User Database Operations', () => {
  const testEmail = `test-${Date.now()}@example.com`
  let createdUserId: string

  afterAll(async () => {
    // Clean up test user
    if (createdUserId) {
      await prisma.user.delete({
        where: { id: createdUserId },
      })
    }
    await prisma.$disconnect()
  })

  it('should create a new user', async () => {
    const hashedPassword = await bcrypt.hash('testpassword123', 10)

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: `testuser_${Date.now()}`,
        name: 'Test User',
        passwordHash: hashedPassword,
      },
    })

    createdUserId = user.id

    expect(user).toHaveProperty('id')
    expect(user.email).toBe(testEmail)
    expect(user.role).toBe('USER')
  })

  it('should find user by email', async () => {
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    expect(user).not.toBeNull()
    expect(user?.email).toBe(testEmail)
  })

  it('should update user profile', async () => {
    const updatedUser = await prisma.user.update({
      where: { id: createdUserId },
      data: {
        name: 'Updated Test User',
        bio: 'This is a test bio',
      },
    })

    expect(updatedUser.name).toBe('Updated Test User')
    expect(updatedUser.bio).toBe('This is a test bio')
  })

  it('should enforce unique email constraint', async () => {
    await expect(
      prisma.user.create({
        data: {
          email: testEmail, // Duplicate email
          username: `anotheruser_${Date.now()}`,
          name: 'Another User',
          passwordHash: 'hash',
        },
      })
    ).rejects.toThrow()
  })
})
