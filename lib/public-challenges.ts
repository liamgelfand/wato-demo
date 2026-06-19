import type { Prisma } from '@prisma/client'

/** Titles/descriptions used by automated tests — hidden from public discovery feeds. */
const TEST_TITLE_PREFIXES = ['E2E Test', 'Integration Test'] as const
const TEST_DESCRIPTION_SNIPPETS = [
  'created by E2E tests',
  'This is a test challenge for integration testing',
] as const

export function isTestChallengeTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase()
  return TEST_TITLE_PREFIXES.some((prefix) => normalized.startsWith(prefix.toLowerCase()))
}

export function isTestChallengeContent(title: string, description: string): boolean {
  if (isTestChallengeTitle(title)) return true
  const desc = description.toLowerCase()
  return TEST_DESCRIPTION_SNIPPETS.some((snippet) =>
    desc.includes(snippet.toLowerCase())
  )
}

/** Prisma filter for user-facing challenge lists (feed, explore, trending). */
export const excludeTestChallengesWhere = {
  NOT: {
    OR: [
      ...TEST_TITLE_PREFIXES.map(
        (prefix): Prisma.ChallengeWhereInput => ({
          title: { startsWith: prefix, mode: 'insensitive' },
        })
      ),
      ...TEST_DESCRIPTION_SNIPPETS.map(
        (snippet): Prisma.ChallengeWhereInput => ({
          description: { contains: snippet, mode: 'insensitive' },
        })
      ),
    ],
  },
} satisfies Prisma.ChallengeWhereInput
