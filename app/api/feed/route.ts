import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { getFriendIds } from '@/lib/friends'
import { getFeedActivity } from '@/lib/feed-activity'
import { prisma } from '@/lib/db'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tabParam = searchParams.get('tab')
  const tab =
    tabParam === 'challenges' ? 'challenges' : tabParam === 'friends' ? 'friends' : 'activity'
  const category = searchParams.get('category') ?? 'ALL'

  if (tab === 'activity') {
    const activity = await getFeedActivity(user.id)
    return NextResponse.json({ tab, activity })
  }

  if (tab === 'friends') {
    const friendIds = await getFriendIds(user.id)
    const friendsActivity =
      friendIds.length > 0
        ? await prisma.attempt.findMany({
            where: {
              userId: { in: friendIds },
              status: 'APPROVED',
              challenge: { status: 'ACTIVE', ...excludeTestChallengesWhere },
            },
            include: {
              user: { select: { username: true, name: true, avatarUrl: true } },
              challenge: { select: { id: true, title: true, points: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
          })
        : []
    return NextResponse.json({ tab, friendsActivity })
  }

  const [challenges, completed] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        status: 'ACTIVE',
        ...excludeTestChallengesWhere,
        ...(category !== 'ALL' && { category: category as never }),
      },
      include: { creator: { select: { username: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.attempt.findMany({
      where: { userId: user.id, status: 'APPROVED' },
      select: { challengeId: true },
    }),
  ])

  const completedIds = new Set(completed.map((c) => c.challengeId))
  return NextResponse.json({
    tab,
    challenges: challenges.filter((c) => !completedIds.has(c.id)),
  })
}
