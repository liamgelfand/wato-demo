import { prisma } from '@/lib/db'
import type { Notification } from '@prisma/client'

export async function resolveNotificationHref(
  notification: Notification
): Promise<string> {
  switch (notification.referenceType) {
    case 'ATTEMPT':
      return notification.referenceId
        ? `/attempt/${notification.referenceId}`
        : '/'
    case 'CHALLENGE':
      return notification.referenceId
        ? `/challenge/${notification.referenceId}`
        : '/'
    case 'MESSAGE': {
      if (!notification.referenceId) return '/messages'

      const thread = await prisma.messageThread.findUnique({
        where: { id: notification.referenceId },
        select: { id: true },
      })
      if (thread) return `/messages/${thread.id}`

      // Legacy notifications stored message id instead of thread id
      const message = await prisma.message.findUnique({
        where: { id: notification.referenceId },
        select: { threadId: true },
      })
      if (message) return `/messages/${message.threadId}`

      return '/messages'
    }
    case 'FRIENDSHIP':
      return '/friends'
    default:
      return '/'
  }
}
