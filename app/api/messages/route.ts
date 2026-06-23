import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [{ userAId: user.id }, { userBId: user.id }],
    },
    include: {
      userA: {
        select: { id: true, username: true, name: true, avatarUrl: true },
      },
      userB: {
        select: { id: true, username: true, name: true, avatarUrl: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderId: true,
          readAt: true,
        },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  const items = threads.map((thread) => {
    const other = thread.userAId === user.id ? thread.userB : thread.userA
    const lastMessage = thread.messages[0] ?? null
    const unread =
      lastMessage !== null &&
      lastMessage.senderId !== user.id &&
      lastMessage.readAt === null

    return {
      id: thread.id,
      otherUser: other,
      lastMessage: lastMessage
        ? {
            body: lastMessage.body,
            createdAt: lastMessage.createdAt,
            isMine: lastMessage.senderId === user.id,
          }
        : null,
      unread,
    }
  })

  return NextResponse.json({ threads: items })
}
