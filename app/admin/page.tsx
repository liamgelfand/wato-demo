import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, Flag, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { requirePermission } from '@/lib/auth-guards'
import { hasPermission, Permissions } from '@/lib/permissions'
import {
  approveAttemptAction,
  approveChallengeAction,
  hideChallengeAction,
  rejectAttemptAction,
  rejectChallengeAction,
  resolveReportAction,
} from '@/app/admin/actions'

export default async function AdminPage() {
  const session = await requirePermission(Permissions.ATTEMPTS_VERIFY)
  const userId = session.user.id
  const isAdmin = hasPermission(session.user.role, Permissions.REPORTS_VIEW)
  const canApproveChallenges = hasPermission(session.user.role, Permissions.CHALLENGES_APPROVE)

  const reports = isAdmin
    ? await prisma.report.findMany({
        where: { status: 'OPEN' },
        include: {
          reporter: {
            select: { username: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const pendingAttempts = await prisma.attempt.findMany({
    where: {
      status: 'PENDING',
      userId: { not: userId },
    },
    include: {
      user: {
        select: { username: true, name: true },
      },
      challenge: {
        select: { title: true, points: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const pendingChallenges = canApproveChallenges
    ? await prisma.challenge.findMany({
        where: {
          status: 'PENDING_REVIEW',
          creatorId: { not: userId },
        },
        include: {
          creator: {
            select: { username: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const recentChallenges = isAdmin
    ? await prisma.challenge.findMany({
        where: { status: 'ACTIVE' },
        include: {
          creator: {
            select: { username: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  const tabCount = (isAdmin ? 1 : 0) + 1 + (canApproveChallenges ? 1 : 0) + (isAdmin ? 1 : 0)
  const defaultTab = isAdmin && reports.length > 0
    ? 'reports'
    : pendingChallenges.length > 0
      ? 'challenge-review'
      : 'attempts'

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          {isAdmin ? 'Admin Dashboard' : 'Review Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Moderate content and manage the community'
            : 'Review pending submissions and challenges'}
        </p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className={`grid w-full grid-cols-${tabCount}`} style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}>
          {isAdmin && (
            <TabsTrigger value="reports">
              Reports {reports.length > 0 && `(${reports.length})`}
            </TabsTrigger>
          )}
          {canApproveChallenges && (
            <TabsTrigger value="challenge-review">
              Challenges {pendingChallenges.length > 0 && `(${pendingChallenges.length})`}
            </TabsTrigger>
          )}
          <TabsTrigger value="attempts">
            Attempts {pendingAttempts.length > 0 && `(${pendingAttempts.length})`}
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="challenges">Active</TabsTrigger>}
        </TabsList>

        {isAdmin && (
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Open Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No open reports
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="destructive">{report.targetType}</Badge>
                            <Badge variant="outline" className="ml-2">{report.reason}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm mb-2">
                          <strong>Reported by:</strong> {report.reporter.name || report.reporter.username}
                        </p>
                        {report.details && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Details:</strong> {report.details}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link
                              href={
                                report.targetType === 'CHALLENGE'
                                  ? `/challenge/${report.targetId}`
                                  : `/attempt/${report.targetId}`
                              }
                            >
                              View Content
                            </Link>
                          </Button>
                          <form action={resolveReportAction.bind(null, report.id, 'RESOLVED')}>
                            <Button type="submit" size="sm" variant="outline">
                              Resolve
                            </Button>
                          </form>
                          <form action={resolveReportAction.bind(null, report.id, 'DISMISSED')}>
                            <Button type="submit" size="sm" variant="ghost">
                              Dismiss
                            </Button>
                          </form>
                          {report.targetType === 'CHALLENGE' && (
                            <form action={hideChallengeAction.bind(null, report.targetId)}>
                              <Button type="submit" size="sm" variant="destructive">
                                Hide Challenge
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canApproveChallenges && (
          <TabsContent value="challenge-review">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Challenges Awaiting Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingChallenges.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No challenges pending approval
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingChallenges.map((challenge) => (
                      <div key={challenge.id} className="border-b pb-4 last:border-0">
                        <p className="font-semibold">{challenge.title}</p>
                        <p className="text-sm text-muted-foreground mb-1">
                          By {challenge.creator.name || challenge.creator.username} ·{' '}
                          {formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true })}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {challenge.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/challenge/${challenge.id}`}>View</Link>
                          </Button>
                          <form action={approveChallengeAction.bind(null, challenge.id)}>
                            <Button type="submit" size="sm" variant="default">
                              Approve
                            </Button>
                          </form>
                          <form action={rejectChallengeAction.bind(null, challenge.id)}>
                            <Button type="submit" size="sm" variant="destructive">
                              Reject
                            </Button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="attempts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pending Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAttempts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending attempts
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingAttempts.map((attempt) => (
                    <div key={attempt.id} className="border-b pb-4 last:border-0">
                      <p className="font-semibold">{attempt.challenge.title}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {attempt.user.name || attempt.user.username}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/attempt/${attempt.id}`}>View Attempt</Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/attempt/${attempt.id}/verify`}>Review</Link>
                        </Button>
                        <form action={approveAttemptAction.bind(null, attempt.id)}>
                          <Button type="submit" size="sm" variant="default">
                            Approve
                          </Button>
                        </form>
                        <form action={rejectAttemptAction.bind(null, attempt.id)}>
                          <Button type="submit" size="sm" variant="destructive">
                            Reject
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="challenges">
            <Card>
              <CardHeader>
                <CardTitle>Active Challenges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentChallenges.map((challenge) => (
                    <div key={challenge.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{challenge.title}</p>
                          <p className="text-sm text-muted-foreground">
                            By {challenge.creator.name || challenge.creator.username}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/challenge/${challenge.id}`}>View</Link>
                          </Button>
                          <form action={hideChallengeAction.bind(null, challenge.id)}>
                            <Button type="submit" size="sm" variant="destructive">
                              Hide
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
