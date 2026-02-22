import { containsBannedWords, isValidCategory } from '@/lib/moderation'
import { ChallengeCategory } from '@prisma/client'

describe('Content Moderation', () => {
  describe('containsBannedWords', () => {
    it('should detect banned words in text', () => {
      expect(containsBannedWords('Let\'s go drinking tonight')).toBe(true)
      expect(containsBannedWords('This is a drug challenge')).toBe(true)
      expect(containsBannedWords('Self-harm is not okay')).toBe(true)
    })

    it('should allow safe content', () => {
      expect(containsBannedWords('Do 50 pushups')).toBe(false)
      expect(containsBannedWords('Draw a beautiful picture')).toBe(false)
      expect(containsBannedWords('Run 5 kilometers')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(containsBannedWords('ALCOHOL is banned')).toBe(true)
      expect(containsBannedWords('AlCoHoL is banned')).toBe(true)
    })

    it('should handle empty strings', () => {
      expect(containsBannedWords('')).toBe(false)
    })
  })

  describe('isValidCategory', () => {
    it('should accept valid categories', () => {
      expect(isValidCategory(ChallengeCategory.FITNESS)).toBe(true)
      expect(isValidCategory(ChallengeCategory.SKILL)).toBe(true)
      expect(isValidCategory(ChallengeCategory.CREATIVITY)).toBe(true)
      expect(isValidCategory(ChallengeCategory.ADVENTURE)).toBe(true)
      expect(isValidCategory(ChallengeCategory.FUNNY)).toBe(true)
    })

    it('should handle invalid categories', () => {
      expect(isValidCategory('INVALID' as any)).toBe(false)
      expect(isValidCategory('' as any)).toBe(false)
    })
  })
})
