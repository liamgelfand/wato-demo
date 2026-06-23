import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getApiUser } from '@/lib/api-auth'
import { getUserBadges } from '@/lib/badges'
import { getUserStreak } from '@/lib/streaks'
import { getSocialCounts } from '@/lib/friends'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      bio: true,
      role: true,
      totalPoints: true,
      challenges: {
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          points: true,
          difficulty: true,
          status: true,
          aiReviewNote: true,
          createdAt: true,
        },
      },
      attempts: {
        where: { status: 'APPROVED' },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: {
          challenge: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              points: true,
              difficulty: true,
            },
          },
        },
      },
      _count: {
        select: {
          attempts: { where: { status: 'APPROVED' } },
          challenges: true,
        },
      },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const [badges, streak, socialCounts, pendingCreatedCount] = await Promise.all([
    getUserBadges(user.id),
    getUserStreak(user.id),
    getSocialCounts(user.id),
    prisma.challenge.count({
      where: { creatorId: user.id, status: 'PENDING_REVIEW' },
    }),
  ])

  const completed = profile.attempts.map((attempt) => ({
    attemptId: attempt.id,
    completedAt: attempt.updatedAt,
    pointsEarned: attempt.challenge.points,
    challenge: attempt.challenge,
  }))

  const created = profile.challenges.map((challenge) => ({
    ...challenge,
    creator: { username: profile.username, name: profile.name },
  }))

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      role: profile.role,
      totalPoints: profile.totalPoints,
      completedCount: profile._count.attempts,
      createdCount: profile._count.challenges,
      pendingCreatedCount,
      friendsCount: socialCounts.friendsCount,
      followersCount: socialCounts.followersCount,
      followingCount: socialCounts.followingCount,
      canModerate: profile.role === 'ADMIN' || profile.role === 'MODERATOR',
    },
    badges,
    streak,
    completed,
    created,
  })
}

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  bio: z.string().max(280).optional(),
})

export async function PATCH(request: Request) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = updateProfileSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: validation.data,
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      totalPoints: true,
    },
  })

  return NextResponse.json({ user: updated })
}
