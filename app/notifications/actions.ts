'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { markAllNotificationsRead } from '@/lib/notifications'

export async function markAllNotificationsReadAction() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  await markAllNotificationsRead(session.user.id)
  revalidatePath('/notifications')
}

export async function openNotificationAction(notificationId: string, href: string) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id,
    },
    data: { read: true },
  })

  revalidatePath('/notifications')
  redirect(href)
}
