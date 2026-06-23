import { prisma } from '@/lib/db'
import { getFriendIds } from '@/lib/friends'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'

export type FeedActivityItem = {
  id: string
  proofUrl: string | null
  proofType: string | null
  updatedAt: Date
  source: 'friend' | 'public'
  user: {
    id: string
    username: string
    name: string | null
    avatarUrl: string | null
  }
  challenge: {
    id: string
    title: string
    points: number
  }
}

const attemptInclude = {
  user: { select: { id: true, username: true, name: true, avatarUrl: true, isPrivate: true } },
  challenge: {
    select: { id: true, title: true, points: true, status: true },
  },
} as const

function toActivityItem(
  attempt: {
    id: string
    proofUrl: string | null
    proofType: string | null
    updatedAt: Date
    user: { id: string; username: string; name: string | null; avatarUrl: string | null }
    challenge: { id: string; title: string; points: number }
  },
  source: 'friend' | 'public'
): FeedActivityItem {
  return {
    id: attempt.id,
    proofUrl: attempt.proofUrl,
    proofType: attempt.proofType,
    updatedAt: attempt.updatedAt,
    source,
    user: {
      id: attempt.user.id,
      username: attempt.user.username,
      name: attempt.user.name,
      avatarUrl: attempt.user.avatarUrl,
    },
    challenge: attempt.challenge,
  }
}

function dedupeByUserAndChallenge(items: FeedActivityItem[], limit: number): FeedActivityItem[] {
  const seen = new Set<string>()
  const deduped: FeedActivityItem[] = []
  for (const item of items) {
    const key = `${item.user.id}::${item.challenge.id}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(item)
    if (deduped.length >= limit) break
  }
  return deduped
}

export async function getFeedActivity(userId: string, limit = 30): Promise<FeedActivityItem[]> {
  const friendIds = await getFriendIds(userId)
  const perSource = Math.ceil(limit / 2) + 5

  const [friendAttempts, publicAttempts] = await Promise.all([
    friendIds.length > 0
      ? prisma.attempt.findMany({
          where: {
            userId: { in: friendIds },
            status: 'APPROVED',
            challenge: { ...excludeTestChallengesWhere },
          },
          include: attemptInclude,
          orderBy: { updatedAt: 'desc' },
          take: perSource,
        })
      : Promise.resolve([]),
    prisma.attempt.findMany({
      where: {
        status: 'APPROVED',
        userId: { not: userId, notIn: friendIds },
        user: { isPrivate: false },
        challenge: { ...excludeTestChallengesWhere },
      },
      include: attemptInclude,
      orderBy: { updatedAt: 'desc' },
      take: perSource,
    }),
  ])

  const merged = [
    ...friendAttempts.map((a) => toActivityItem(a, 'friend')),
    ...publicAttempts.map((a) => toActivityItem(a, 'public')),
  ]

  merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())

  return dedupeByUserAndChallenge(merged, limit)
}
