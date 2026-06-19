import {
  isTestChallengeContent,
  isTestChallengeTitle,
} from '@/lib/public-challenges'

describe('public-challenges', () => {
  it('detects E2E test challenge titles', () => {
    expect(isTestChallengeTitle('E2E Test Challenge')).toBe(true)
    expect(isTestChallengeTitle('e2e test something')).toBe(true)
  })

  it('detects integration test challenge titles', () => {
    expect(isTestChallengeTitle('Integration Test Challenge')).toBe(true)
  })

  it('allows real challenge titles', () => {
    expect(isTestChallengeTitle('Run 5K')).toBe(false)
    expect(isTestChallengeTitle('My E2E Test is not a prefix')).toBe(false)
  })

  it('detects test content by description', () => {
    expect(
      isTestChallengeContent('Custom title', 'This is a test challenge created by E2E tests')
    ).toBe(true)
    expect(
      isTestChallengeContent(
        'Custom title',
        'This is a test challenge for integration testing'
      )
    ).toBe(true)
    expect(isTestChallengeContent('Run 5K', 'Complete a 5 kilometer run')).toBe(false)
  })
})
