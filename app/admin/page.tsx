import { prisma } from '@/lib/db'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, Flag } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { requirePermission } from '@/lib/auth-guards'
import { hasPermission, Permissions } from '@/lib/permissions'
import {
  approveAttemptAction,
  hideChallengeAction,
  rejectAttemptAction,
  resolveReportAction,
} from '@/app/admin/actions'

export default async function AdminPage() {
  const session = await requirePermission(Permissions.ATTEMPTS_VERIFY)
  const isAdmin = hasPermission(session.user.role, Permissions.REPORTS_VIEW)

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
    where: { status: 'PENDING' },
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
            : 'Review pending challenge submissions'}
        </p>
      </div>

      <Tabs defaultValue={isAdmin ? 'reports' : 'attempts'}>
        <TabsList className={isAdmin ? 'grid w-full grid-cols-3' : 'grid w-full grid-cols-1'}>
          {isAdmin && (
            <TabsTrigger value="reports">
              Reports {reports.length > 0 && `(${reports.length})`}
            </TabsTrigger>
          )}
          <TabsTrigger value="attempts">
            Pending Attempts {pendingAttempts.length > 0 && `(${pendingAttempts.length})`}
          </TabsTrigger>
          {isAdmin && <TabsTrigger value="challenges">Challenges</TabsTrigger>}
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
                <CardTitle>Recent Challenges</CardTitle>
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
