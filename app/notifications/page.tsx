import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { resolveNotificationHref } from '@/lib/notification-links'
import {
  markAllNotificationsReadAction,
  openNotificationAction,
} from './actions'

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

  const notificationLinks = await Promise.all(
    notifications.map(async (notification) => ({
      id: notification.id,
      href: await resolveNotificationHref(notification),
    }))
  )

  const hrefById = Object.fromEntries(
    notificationLinks.map((link) => [link.id, link.href])
  )

  const hasUnread = notifications.some((n) => !n.read)

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
        {hasUnread && (
          <form action={markAllNotificationsReadAction}>
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
            {notifications.map((notification) => {
              const href = hrefById[notification.id]
              const openAction = openNotificationAction.bind(
                null,
                notification.id,
                href
              )

              return (
                <form key={notification.id} action={openAction}>
                  <button
                    type="submit"
                    className={`block w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Bell
                        className={`h-5 w-5 mt-1 shrink-0 ${
                          !notification.read
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                </form>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
