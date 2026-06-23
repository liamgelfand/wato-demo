import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { sendMessageSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId: routeThreadId } = await params
    const user = await getApiUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id
    const body = await request.json()
    
    const validation = sendMessageSchema.safeParse({
      threadId: routeThreadId,
      ...body,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { threadId, body: messageBody } = validation.data

    // Verify thread exists and user is part of it
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
    })

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    if (thread.userAId !== userId && thread.userBId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        body: messageBody,
      },
    })

    // Update thread's lastMessageAt
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date() },
    })

    // Notify the other user
    const recipientId = thread.userAId === userId ? thread.userBId : thread.userAId
    await createNotification({
      userId: recipientId,
      type: 'MESSAGE',
      referenceType: 'MESSAGE',
      referenceId: threadId,
      title: 'New message',
      body: `${user.username} sent you a message`,
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
