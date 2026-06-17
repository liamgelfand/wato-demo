import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserBadges } from '@/lib/badges'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrivacyToggle } from '@/components/profile/privacy-toggle'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatarUrl: true,
      isPrivate: true,
      totalPoints: true,
      attempts: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { challenge: true },
      },
      challenges: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  const badges = await getUserBadges(user.id)

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : user.username.substring(0, 2).toUpperCase()

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.name || user.username}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{user.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{user.attempts.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{user.challenges.length}</div>
              <div className="text-sm text-muted-foreground">Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{badges.length}</div>
              <div className="text-sm text-muted-foreground">Badges</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent>
          <PrivacyToggle isPrivate={user.isPrivate} />
        </CardContent>
      </Card>

      {badges.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-2xl" role="img" aria-label={badge.name}>{badge.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Completions</CardTitle>
        </CardHeader>
        <CardContent>
          {user.attempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No completed challenges yet. Start attempting challenges!
            </p>
          ) : (
            <div className="space-y-4">
              {user.attempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <h3 className="font-semibold">{attempt.challenge.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Completed {new Date(attempt.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">+{attempt.challenge.points} pts</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
