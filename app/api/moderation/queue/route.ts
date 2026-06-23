import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { hasPermission, Permissions } from '@/lib/permissions'

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const canVerifyAttempts = hasPermission(user.role, Permissions.ATTEMPTS_VERIFY)
  const canApproveChallenges = hasPermission(user.role, Permissions.CHALLENGES_APPROVE)

  if (!canVerifyAttempts && !canApproveChallenges) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [pendingAttempts, pendingChallenges] = await Promise.all([
    canVerifyAttempts
      ? prisma.attempt.findMany({
          where: {
            status: 'PENDING',
            userId: { not: user.id },
          },
          include: {
            user: { select: { id: true, username: true, name: true, avatarUrl: true } },
            challenge: { select: { id: true, title: true, points: true, category: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]),
    canApproveChallenges
      ? prisma.challenge.findMany({
          where: {
            status: 'PENDING_REVIEW',
            creatorId: { not: user.id },
          },
          include: {
            creator: { select: { id: true, username: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 30,
        })
      : Promise.resolve([]),
  ])

  return NextResponse.json({
    pendingAttempts: pendingAttempts.map((a) => ({
      id: a.id,
      proofUrl: a.proofUrl,
      proofType: a.proofType,
      createdAt: a.createdAt,
      user: a.user,
      challenge: a.challenge,
    })),
    pendingChallenges: pendingChallenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      points: c.points,
      difficulty: c.difficulty,
      aiReviewNote: c.aiReviewNote,
      createdAt: c.createdAt,
      creator: c.creator,
    })),
  })
}
