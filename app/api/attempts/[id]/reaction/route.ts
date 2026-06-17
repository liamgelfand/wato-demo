import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { attemptReactionSchema } from '@/lib/validations'
import { getEngageableAttempt } from '@/lib/attempt-engagement-access'
import type { AttemptReactionType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempt = await getEngageableAttempt(
      attemptId,
      session.user.id,
      session.user.role
    )
    if (!attempt) {
      return NextResponse.json({ error: 'Cannot react to this attempt' }, { status: 403 })
    }

    const body = await request.json()
    const validation = attemptReactionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type } = validation.data

    const existing = await prisma.attemptReaction.findUnique({
      where: {
        attemptId_userId: { attemptId, userId: session.user.id },
      },
    })

    if (existing?.type === type) {
      await prisma.attemptReaction.delete({ where: { id: existing.id } })
    } else if (existing) {
      await prisma.attemptReaction.update({
        where: { id: existing.id },
        data: { type: type as AttemptReactionType },
      })
    } else {
      await prisma.attemptReaction.create({
        data: {
          attemptId,
          userId: session.user.id,
          type: type as AttemptReactionType,
        },
      })
    }

    const reactions = await prisma.attemptReaction.groupBy({
      by: ['type'],
      where: { attemptId },
      _count: true,
    })

    const userReaction = await prisma.attemptReaction.findUnique({
      where: {
        attemptId_userId: { attemptId, userId: session.user.id },
      },
      select: { type: true },
    })

    return NextResponse.json({
      userReaction: userReaction?.type ?? null,
      counts: Object.fromEntries(reactions.map((r) => [r.type, r._count])),
    })
  } catch (error) {
    console.error('Attempt reaction error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
