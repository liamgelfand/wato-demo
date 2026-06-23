import { prisma } from '@/lib/db'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'
import { getTrendingChallenges, type TrendingChallenge } from '@/lib/trending'

export type RecommendedChallenge = TrendingChallenge

export async function getRecommendedChallenges(
  userId: string,
  limit = 12
): Promise<RecommendedChallenge[]> {
  const [completedAttempts, createdChallenges] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId, status: 'APPROVED' },
      select: { challengeId: true, challenge: { select: { category: true } } },
      take: 50,
    }),
    prisma.challenge.findMany({
      where: { creatorId: userId },
      select: { category: true },
      take: 20,
    }),
  ])

  const skipIds = new Set(completedAttempts.map((c) => c.challengeId))

  const categoryCounts = new Map<string, number>()
  for (const row of completedAttempts) {
    const cat = row.challenge.category
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }
  for (const row of createdChallenges) {
    categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1)
  }

  const preferredCategories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)

  let results: RecommendedChallenge[] = []

  if (preferredCategories.length > 0) {
    const challenges = await prisma.challenge.findMany({
      where: {
        status: 'ACTIVE',
        ...excludeTestChallengesWhere,
        id: { notIn: Array.from(skipIds) },
        category: { in: preferredCategories as never },
      },
      include: {
        creator: { select: { username: true, name: true, avatarUrl: true } },
        _count: { select: { attempts: { where: { status: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    })

    results = challenges
      .sort((a, b) => b._count.attempts - a._count.attempts)
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        points: c.points,
        difficulty: c.difficulty,
        completionCount: c._count.attempts,
        creator: c.creator,
      }))
  }

  if (results.length < limit) {
    const trending = await getTrendingChallenges(limit)
    const existing = new Set(results.map((c) => c.id))
    for (const t of trending) {
      if (results.length >= limit) break
      if (!existing.has(t.id) && !skipIds.has(t.id)) {
        results.push(t)
        existing.add(t.id)
      }
    }
  }

  return results.slice(0, limit)
}
