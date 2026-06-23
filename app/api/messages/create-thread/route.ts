import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { createThreadSchema } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    const user = await getApiUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createThreadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { friendId } = validation.data
    const userId = user.id

    if (friendId === userId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId, status: 'ACCEPTED' },
          { requesterId: friendId, addresseeId: userId, status: 'ACCEPTED' },
        ],
      },
    })

    if (!friendship) {
      return NextResponse.json(
        { error: 'You must be friends to start a conversation' },
        { status: 403 }
      )
    }

    const [userAId, userBId] = userId < friendId ? [userId, friendId] : [friendId, userId]

    const thread = await prisma.messageThread.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId },
    })

    return NextResponse.json({ threadId: thread.id })
  } catch (error) {
    console.error('Create thread error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
