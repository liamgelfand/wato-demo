import {
  createChallengeSchema,
  createAttemptSchema,
  sendFriendRequestSchema,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('createChallengeSchema', () => {
    it('should validate a correct challenge', () => {
      const validChallenge = {
        title: 'Do 50 pushups',
        description: 'Complete 50 pushups in one session',
        category: 'FITNESS',
        difficulty: 'MEDIUM',
        basePoints: 100,
      }

      const result = createChallengeSchema.safeParse(validChallenge)
      expect(result.success).toBe(true)
    })

    it('should reject challenge with short title', () => {
      const invalidChallenge = {
        title: 'Hi',
        description: 'Complete 50 pushups in one session',
        category: 'FITNESS',
        difficulty: 'MEDIUM',
        basePoints: 100,
      }

      const result = createChallengeSchema.safeParse(invalidChallenge)
      expect(result.success).toBe(false)
    })

    it('should reject challenge with negative points', () => {
      const invalidChallenge = {
        title: 'Do 50 pushups',
        description: 'Complete 50 pushups in one session',
        category: 'FITNESS',
        difficulty: 'MEDIUM',
        basePoints: -10,
      }

      const result = createChallengeSchema.safeParse(invalidChallenge)
      expect(result.success).toBe(false)
    })

    it('should reject challenge with invalid category', () => {
      const invalidChallenge = {
        title: 'Do 50 pushups',
        description: 'Complete 50 pushups in one session',
        category: 'INVALID_CATEGORY',
        difficulty: 'MEDIUM',
        basePoints: 100,
      }

      const result = createChallengeSchema.safeParse(invalidChallenge)
      expect(result.success).toBe(false)
    })
  })

  describe('createAttemptSchema', () => {
    it('should validate a correct attempt', () => {
      const validAttempt = {
        challengeId: 'clx123456789',
      }

      const result = createAttemptSchema.safeParse(validAttempt)
      expect(result.success).toBe(true)
    })

    it('should reject attempt without challengeId', () => {
      const invalidAttempt = {}

      const result = createAttemptSchema.safeParse(invalidAttempt)
      expect(result.success).toBe(false)
    })
  })

  describe('sendFriendRequestSchema', () => {
    it('should validate a correct friend request', () => {
      const validRequest = {
        username: 'testuser123',
      }

      const result = sendFriendRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject request with short username', () => {
      const invalidRequest = {
        username: 'ab',
      }

      const result = sendFriendRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })
})
