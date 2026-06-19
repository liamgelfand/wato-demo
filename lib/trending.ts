import { prisma } from '@/lib/db'
import type { ChallengeCategory } from '@prisma/client'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'

export interface TrendingChallenge {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  points: number
  difficulty: number
  completionCount: number
  creator: {
    username: string
    name: string | null
    avatarUrl: string | null
  }
}

export async function getTrendingChallenges(limit = 20): Promise<TrendingChallenge[]> {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const grouped = await prisma.attempt.groupBy({
    by: ['challengeId'],
    where: {
      status: 'APPROVED',
      updatedAt: { gte: oneWeekAgo },
      challenge: { status: 'ACTIVE', ...excludeTestChallengesWhere },
    },
    _count: { id: true },
  })

  const sorted = grouped
    .map((g) => ({ challengeId: g.challengeId, count: g._count.id }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  if (sorted.length === 0) {
    const recent = await prisma.challenge.findMany({
      where: { status: 'ACTIVE', ...excludeTestChallengesWhere },
      include: {
        creator: { select: { username: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return recent.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      points: c.points,
      difficulty: c.difficulty,
      completionCount: 0,
      creator: c.creator,
    }))
  }

  const challenges = await prisma.challenge.findMany({
    where: {
      id: { in: sorted.map((s) => s.challengeId) },
      status: 'ACTIVE',
      ...excludeTestChallengesWhere,
    },
    include: {
      creator: { select: { username: true, name: true, avatarUrl: true } },
    },
  })

  return sorted.flatMap(({ challengeId, count }) => {
    const c = challenges.find((ch) => ch.id === challengeId)
    if (!c) return []
    return [
      {
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        points: c.points,
        difficulty: c.difficulty,
        completionCount: count,
        creator: c.creator,
      },
    ]
  })
}