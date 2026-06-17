import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getEngageableAttempt } from '@/lib/attempt-engagement-access'

export async function POST(
  _request: Request,
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
      return NextResponse.json({ error: 'Cannot upvote this attempt' }, { status: 403 })
    }

    const existing = await prisma.attemptUpvote.findUnique({
      where: {
        attemptId_userId: { attemptId, userId: session.user.id },
      },
    })

    if (existing) {
      await prisma.attemptUpvote.delete({ where: { id: existing.id } })
      const count = await prisma.attemptUpvote.count({ where: { attemptId } })
      return NextResponse.json({ upvoted: false, count })
    }

    await prisma.attemptUpvote.create({
      data: { attemptId, userId: session.user.id },
    })
    const count = await prisma.attemptUpvote.count({ where: { attemptId } })
    return NextResponse.json({ upvoted: true, count })
  } catch (error) {
    console.error('Attempt upvote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
