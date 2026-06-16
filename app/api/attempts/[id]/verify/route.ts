import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { submitVerificationVoteSchema } from '@/lib/validations'
import { awardPoints } from '@/lib/points'
import { createNotification } from '@/lib/notifications'
import type { VerificationVoteType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeAttemptId } = await params
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Get attempt with challenge info
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        challenge: true,
      },
    })

    if (!attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      )
    }

    if (attempt.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Attempt is not pending verification' },
        { status: 400 }
      )
    }

    // Check if voter is the attempt owner
    if (attempt.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot vote on your own attempt' },
        { status: 400 }
      )
    }

    // Check if voter is friends with attempt owner
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, addresseeId: attempt.userId, status: 'ACCEPTED' },
          { requesterId: attempt.userId, addresseeId: session.user.id, status: 'ACCEPTED' },
        ],
      },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'You must be friends with the user to verify their attempt' },
        { status: 403 }
      )
    }

    // Check if already voted
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
        { error: 'You have already voted on this attempt' },
        { status: 400 }
      )
    }

    // Create vote
    await prisma.verificationVote.create({
      data: {
        attemptId,
        voterId: session.user.id,
        vote: vote as VerificationVoteType,
        reason: reason || null,
      },
    })

    // Notify attempt owner
    await createNotification({
      userId: attempt.userId,
      type: 'VERIFICATION_VOTE',
      referenceType: 'ATTEMPT',
      referenceId: attemptId,
      title: `New verification vote`,
      body: `${session.user.username} ${vote === 'VERIFY' ? 'verified' : 'rejected'} your attempt`,
    })

    // Check vote counts
    const votes = await prisma.verificationVote.groupBy({
      by: ['vote'],
      where: { attemptId },
      _count: true,
    })

    const verifyCount = votes.find(v => v.vote === 'VERIFY')?._count || 0
    const rejectCount = votes.find(v => v.vote === 'REJECT')?._count || 0

    // Auto-approve if 2+ verifies and 0 rejects
    if (verifyCount >= 2 && rejectCount === 0) {
      await awardPoints(attempt.userId, attemptId, attempt.challenge.points)
    }

    // Auto-reject if 1+ rejects
    if (rejectCount >= 1) {
      await prisma.attempt.update({
        where: { id: attemptId },
        data: { status: 'REJECTED' },
      })

      await createNotification({
        userId: attempt.userId,
        type: 'ATTEMPT_REJECTED',
        referenceType: 'ATTEMPT',
        referenceId: attemptId,
        title: 'Attempt Rejected',
        body: `Your attempt was not approved. Check the feedback and try again!`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verification vote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
