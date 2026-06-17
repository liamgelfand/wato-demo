import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { submitVerificationVoteSchema } from '@/lib/validations'
import { awardPoints } from '@/lib/points'
import { createNotification } from '@/lib/notifications'
import { requireApiPermission, requireApiUser } from '@/lib/auth-guards'
import { Permissions } from '@/lib/permissions'
import type { VerificationVoteType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeAttemptId } = await params
    const session = await requireApiUser()
    if (session instanceof NextResponse) return session

    const denied = requireApiPermission(session.user.role, Permissions.ATTEMPTS_VERIFY)
    if (denied) return denied

    const body = await request.json()

    const validation = submitVerificationVoteSchema.safeParse({
      attemptId: routeAttemptId,
      ...body,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { attemptId, vote, reason } = validation.data

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { challenge: true },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Attempt is not pending verification' },
        { status: 400 }
      )
    }

    if (attempt.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot verify your own attempt' },
        { status: 400 }
      )
    }

    const existingVote = await prisma.verificationVote.findUnique({
      where: {
        attemptId_voterId: {
          attemptId,
          voterId: session.user.id,
        },
      },
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already reviewed this attempt' },
        { status: 400 }
      )
    }

    await prisma.verificationVote.create({
      data: {
        attemptId,
        voterId: session.user.id,
        vote: vote as VerificationVoteType,
        reason: reason || null,
      },
    })

    if (vote === 'VERIFY') {
      await awardPoints(attempt.userId, attemptId, attempt.challenge.points)
    } else {
      await prisma.attempt.update({
        where: { id: attemptId },
        data: { status: 'REJECTED' },
      })
      await createNotification({
        userId: attempt.userId,
        type: 'ATTEMPT_REJECTED',
        referenceType: 'ATTEMPT',
        referenceId: attemptId,
        title: 'Attempt rejected',
        body: reason
          ? `Your "${attempt.challenge.title}" submission was not approved: ${reason}`
          : `Your "${attempt.challenge.title}" submission was not approved.`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verification vote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
