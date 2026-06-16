import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import type { Notification } from '@prisma/client'

async function markAllRead(userId: string) {
  'use server'
  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  })
}

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = session.user.id

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const markAllReadAction = markAllRead.bind(null, userId)

  const getNotificationLink = (notification: Notification) => {
    switch (notification.referenceType) {
      case 'ATTEMPT':
        return `/attempt/${notification.referenceId}`
      case 'CHALLENGE':
        return `/challenge/${notification.referenceId}`
      case 'MESSAGE':
        return notification.referenceId
          ? `/messages/${notification.referenceId}`
          : '/messages'
      case 'FRIENDSHIP':
        return `/friends`
      default:
        return '/'
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated on your challenges and friends
          </p>
        </div>
        {notifications.some(n => !n.read) && (
          <form action={markAllReadAction}>
            <Button variant="outline" size="sm" type="submit">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </form>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                className={`block p-4 hover:bg-muted/50 transition-colors ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Bell className={`h-5 w-5 mt-1 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{notification.title}</p>
                      {!notification.read && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
