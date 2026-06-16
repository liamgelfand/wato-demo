import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function LeaderboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = session.user.id

  // Get user's friends
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { requesterId: userId, status: 'ACCEPTED' },
        { addresseeId: userId, status: 'ACCEPTED' },
      ],
    },
  })

  const friendIds = friendships.map(f => 
    f.requesterId === userId ? f.addresseeId : f.requesterId
  )

  // Include self in leaderboard
  const allUserIds = [userId, ...friendIds]

  // All-time leaderboard
  const allTimeUsers = await prisma.user.findMany({
    where: {
      id: { in: allUserIds },
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      totalPoints: true,
    },
    orderBy: {
      totalPoints: 'desc',
    },
  })

  // Weekly leaderboard
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const weeklyPoints = await prisma.pointsLedger.groupBy({
    by: ['userId'],
    where: {
      userId: { in: allUserIds },
      createdAt: { gte: oneWeekAgo },
    },
    _sum: {
      points: true,
    },
  })

  const weeklyUsers = await prisma.user.findMany({
    where: {
      id: { in: weeklyPoints.map(w => w.userId) },
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
    },
  })

  const weeklyLeaderboard = weeklyUsers
    .map(user => ({
      ...user,
      weeklyPoints: weeklyPoints.find(w => w.userId === user.id)?._sum.points || 0,
    }))
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-sm text-muted-foreground">{rank}</span>
  }

  type LeaderboardUser = {
    id: string
    username: string
    name: string | null
    avatarUrl: string | null
    totalPoints: number
    weeklyPoints?: number
  }

  const renderLeaderboard = (users: LeaderboardUser[], pointsKey: string, isWeekly = false) => (
    <div className="space-y-2">
      {users.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No data available. Add friends to see the leaderboard!
        </p>
      ) : (
        users.map((user, index) => {
          const rank = index + 1
          const isCurrentUser = user.id === userId
          const initials = user.name
            ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
            : user.username.substring(0, 2).toUpperCase()
          const points = isWeekly ? user.weeklyPoints : user.totalPoints

          return (
            <div
              key={user.id}
              data-testid={isCurrentUser ? 'current-user-entry' : 'leaderboard-entry'}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border',
                isCurrentUser && 'bg-primary/5 border-primary/20'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {getRankIcon(rank)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    {user.name || user.username}
                    {isCurrentUser && <Badge variant="outline">You</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{points}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Compete with your friends and climb to the top!
        </p>
      </div>

      <Tabs defaultValue="alltime">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alltime">All Time</TabsTrigger>
          <TabsTrigger value="weekly">This Week</TabsTrigger>
        </TabsList>

        <TabsContent value="alltime">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                All-Time Champions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(allTimeUsers, 'totalPoints')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Leaders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderLeaderboard(weeklyLeaderboard, 'weeklyPoints', true)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
