import { calculateChallengePoints } from '@/lib/points'
import { ChallengeDifficulty } from '@prisma/client'

describe('Points Calculation', () => {
  describe('calculateChallengePoints', () => {
    it('should calculate points correctly for EASY difficulty', () => {
      const points = calculateChallengePoints(100, ChallengeDifficulty.EASY)
      expect(points).toBe(100) // 100 * 1.0
    })

    it('should calculate points correctly for MEDIUM difficulty', () => {
      const points = calculateChallengePoints(100, ChallengeDifficulty.MEDIUM)
      expect(points).toBe(150) // 100 * 1.5
    })

    it('should calculate points correctly for HARD difficulty', () => {
      const points = calculateChallengePoints(100, ChallengeDifficulty.HARD)
      expect(points).toBe(200) // 100 * 2.0
    })

    it('should calculate points correctly for EXPERT difficulty', () => {
      const points = calculateChallengePoints(100, ChallengeDifficulty.EXPERT)
      expect(points).toBe(300) // 100 * 3.0
    })

    it('should calculate points correctly for EXTREME difficulty', () => {
      const points = calculateChallengePoints(100, ChallengeDifficulty.EXTREME)
      expect(points).toBe(500) // 100 * 5.0
    })

    it('should handle zero base points', () => {
      const points = calculateChallengePoints(0, ChallengeDifficulty.HARD)
      expect(points).toBe(0)
    })

    it('should handle decimal base points', () => {
      const points = calculateChallengePoints(33.33, ChallengeDifficulty.MEDIUM)
      expect(points).toBeCloseTo(50, 0) // Rounded
    })
  })
})
