import { prisma } from '@/lib/db'
import { getFriendSuggestions } from '@/lib/friend-suggestions'
import { getFriendIds } from '@/lib/friends'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'
import type { FeedActivityItem } from '@/lib/feed-activity'

const attemptSelect = {
  user: { select: { id: true, username: true, name: true, avatarUrl: true } },
  challenge: { select: { id: true, title: true, points: true } },
} as const

function mapAttempt(a: {
  id: string
  proofUrl: string | null
  proofType: string | null
  updatedAt: Date
  user: { id: string; username: string; name: string | null; avatarUrl: string | null }
  challenge: { id: string; title: string; points: number }
}): FeedActivityItem {
  return {
    id: a.id,
    proofUrl: a.proofUrl,
    proofType: a.proofType,
    updatedAt: a.updatedAt,
    source: 'public',
    user: a.user,
    challenge: a.challenge,
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

async function fetchCommunityAttempts(
  userId: string,
  excludeUserIds: string[],
  limit: number
): Promise<FeedActivityItem[]> {
  const attempts = await prisma.attempt.findMany({
    where: {
      status: 'APPROVED',
      userId: { not: userId, notIn: excludeUserIds },
      user: { isPrivate: false },
      challenge: { ...excludeTestChallengesWhere },
    },
    include: attemptSelect,
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
  return attempts.map(mapAttempt)
}

export async function getExploreActivity(userId: string, limit = 15): Promise<FeedActivityItem[]> {
  const [suggestions, following, friendIds] = await Promise.all([
    getFriendSuggestions(userId, 12),
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    getFriendIds(userId),
  ])

  const interestingUserIds = [
    ...new Set([
      ...suggestions.map((s) => s.id),
      ...following.map((f) => f.followingId),
    ]),
  ].filter((id) => id !== userId && !friendIds.includes(id))

  let results: FeedActivityItem[] = []

  if (interestingUserIds.length > 0) {
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: { in: interestingUserIds },
        status: 'APPROVED',
        challenge: { ...excludeTestChallengesWhere },
      },
      include: attemptSelect,
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })
    results = attempts.map(mapAttempt)
  }

  if (results.length < limit) {
    const seen = new Set(results.map((r) => `${r.user.id}::${r.challenge.id}`))
    const exclude = [...friendIds, ...interestingUserIds]
    const community = await fetchCommunityAttempts(userId, exclude, limit * 2)
    for (const item of community) {
      if (results.length >= limit) break
      const key = `${item.user.id}::${item.challenge.id}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(item)
    }
  }

  return dedupeByUserAndChallenge(results, limit)
}
