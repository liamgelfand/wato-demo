import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params
    const user = await getApiUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        userB: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Check if user is part of the thread
    if (thread.userAId !== userId && thread.userBId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    const messageIds = messages.map((message) => message.id)

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    // Mark related message notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        type: 'MESSAGE',
        read: false,
        OR: [
          { referenceId: threadId },
          ...(messageIds.length > 0
            ? [{ referenceId: { in: messageIds } }]
            : []),
        ],
      },
      data: { read: true },
    })

    return NextResponse.json({ thread, messages, viewerId: userId })
  } catch (error) {
    console.error('Fetch thread error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
