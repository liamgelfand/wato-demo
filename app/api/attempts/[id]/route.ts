import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { canViewAttempt } from '@/lib/attempt-access'
import { canEngageOnAttempt } from '@/lib/attempt-engagement'
import { prisma } from '@/lib/db'
import type { AttemptReactionType } from '@prisma/client'

function buildReactionCounts(
  reactions: Array<{ type: AttemptReactionType }>
): Partial<Record<AttemptReactionType, number>> {
  const counts: Partial<Record<AttemptReactionType, number>> = {}
  for (const r of reactions) {
    counts[r.type] = (counts[r.type] ?? 0) + 1
  }
  return counts
}

async function mapComments(commentIds: string[], viewerId: string) {
  const comments = await prisma.attemptComment.findMany({
    where: { id: { in: commentIds } },
    include: {
      user: { select: { id: true, username: true, name: true, avatarUrl: true } },
      upvotes: { select: { userId: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, username: true, name: true, avatarUrl: true } },
          upvotes: { select: { userId: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    user: c.user,
    upvoteCount: c.upvotes.length,
    userUpvoted: c.upvotes.some((u) => u.userId === viewerId),
    replies: c.replies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      user: r.user,
      upvoteCount: r.upvotes.length,
      userUpvoted: r.upvotes.some((u) => u.userId === viewerId),
    })),
  }))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getApiUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            description: true,
            points: true,
            category: true,
            creator: { select: { username: true, name: true } },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
            isPrivate: true,
          },
        },
        upvotes: { select: { userId: true } },
        reactions: { select: { type: true, userId: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const allowed = await canViewAttempt(
      user.id,
      {
        userId: attempt.userId,
        status: attempt.status,
        ownerIsPrivate: attempt.user.isPrivate,
      },
      user.role
    )

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userReaction =
      attempt.reactions.find((r) => r.userId === user.id)?.type ?? null

    const comments = await mapComments(
      attempt.comments.map((c) => c.id),
      user.id
    )

    return NextResponse.json({
      id: attempt.id,
      status: attempt.status,
      proofUrl: attempt.proofUrl,
      proofType: attempt.proofType,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
      challenge: attempt.challenge,
      user: {
        id: attempt.user.id,
        username: attempt.user.username,
        name: attempt.user.name,
        avatarUrl: attempt.user.avatarUrl,
      },
      engagement: {
        canEngage: canEngageOnAttempt(attempt.status) && Boolean(attempt.proofUrl),
        upvoteCount: attempt.upvotes.length,
        userUpvoted: attempt.upvotes.some((u) => u.userId === user.id),
        reactionCounts: buildReactionCounts(attempt.reactions),
        userReaction,
        comments,
      },
    })
  } catch (error) {
    console.error('Fetch attempt error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
