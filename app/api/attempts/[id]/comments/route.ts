import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { attemptCommentSchema } from '@/lib/validations'
import { getEngageableAttempt } from '@/lib/attempt-engagement-access'
import { createNotification } from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await params
    const user = await getApiUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempt = await getEngageableAttempt(attemptId, user.id, user.role)
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

    if (validation.data.parentId) {
      const parent = await prisma.attemptComment.findFirst({
        where: { id: validation.data.parentId, attemptId, parentId: null },
      })
      if (!parent) {
        return NextResponse.json({ error: 'Invalid reply target' }, { status: 400 })
      }
    }

    const comment = await prisma.attemptComment.create({
      data: {
        attemptId,
        userId: user.id,
        body: validation.data.body,
        parentId: validation.data.parentId,
      },
      include: {
        user: { select: { username: true, name: true, avatarUrl: true } },
      },
    })

    if (attempt.userId !== user.id) {
      await createNotification({
        userId: attempt.userId,
        type: 'ATTEMPT_COMMENT',
        referenceType: 'ATTEMPT',
        referenceId: attemptId,
        title: 'New comment on your attempt',
        body: `${user.name || user.username} commented on your proof`,
      })
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Attempt comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
