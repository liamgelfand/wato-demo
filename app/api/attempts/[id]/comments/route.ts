import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { attemptCommentSchema } from '@/lib/validations'
import { getEngageableAttempt } from '@/lib/attempt-engagement-access'

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
      return NextResponse.json({ error: 'Cannot comment on this attempt' }, { status: 403 })
    }

    const body = await request.json()
    const validation = attemptCommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const comment = await prisma.attemptComment.create({
      data: {
        attemptId,
        userId: session.user.id,
        body: validation.data.body,
      },
      include: {
        user: { select: { username: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Attempt comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
