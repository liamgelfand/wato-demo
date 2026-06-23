import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: challengeId } = await params

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { status: true, prerequisiteChallengeId: true },
  })

  if (!challenge || challenge.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Challenge not available' }, { status: 400 })
  }

  if (challenge.prerequisiteChallengeId) {
    const prereqDone = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        challengeId: challenge.prerequisiteChallengeId,
        status: 'APPROVED',
      },
    })
    if (!prereqDone) {
      return NextResponse.json({ error: 'Complete the prerequisite challenge first' }, { status: 400 })
    }
  }

  const existing = await prisma.attempt.findFirst({
    where: { userId: user.id, challengeId, status: 'DRAFT' },
  })
  if (existing) {
    return NextResponse.json({ attemptId: existing.id })
  }

  const attempt = await prisma.attempt.create({
    data: { userId: user.id, challengeId, status: 'DRAFT' },
  })

  return NextResponse.json({ attemptId: attempt.id }, { status: 201 })
}
