// Mock Prisma before importing points
jest.mock('@/lib/db', () => ({
  prisma: {
    $on: jest.fn(),
    $disconnect: jest.fn(),
  },
}))

import { calculateChallengePoints } from '@/lib/points'

// Use string literals instead of enum to avoid Prisma import issues in tests
describe('Points Calculation', () => {
  describe('calculateChallengePoints', () => {
    it('should calculate points correctly for EASY difficulty', () => {
      const points = calculateChallengePoints(100, 'EASY')
      expect(points).toBe(100) // 100 * 1.0
    })

    it('should calculate points correctly for MEDIUM difficulty', () => {
      const points = calculateChallengePoints(100, 'MEDIUM')
      expect(points).toBe(150) // 100 * 1.5
    })

    it('should calculate points correctly for HARD difficulty', () => {
      const points = calculateChallengePoints(100, 'HARD')
      expect(points).toBe(200) // 100 * 2.0
    })

    it('should calculate points correctly for EXPERT difficulty', () => {
      const points = calculateChallengePoints(100, 'EXPERT')
      expect(points).toBe(300) // 100 * 3.0
    })

    it('should calculate points correctly for EXTREME difficulty', () => {
      const points = calculateChallengePoints(100, 'EXTREME')
      expect(points).toBe(500) // 100 * 5.0
    })

    it('should handle zero base points', () => {
      const points = calculateChallengePoints(0, 'HARD')
      expect(points).toBe(0)
    })

    it('should handle decimal base points', () => {
      const points = calculateChallengePoints(33.33, 'MEDIUM')
      expect(points).toBeCloseTo(50, 0) // Rounded
    })
  })
})
