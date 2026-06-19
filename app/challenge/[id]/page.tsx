import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission, Permissions } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ReportDialog } from '@/components/moderation/report-dialog'
import { ShareButton } from '@/components/share/share-button'
import { challengeUrl } from '@/lib/deep-links'
import { Link2, Clock, Calendar, Trophy } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { CATEGORY_COLORS, CATEGORY_LABELS, type ChallengeCategoryName } from '@/lib/categories'

interface PageProps {
  params: Promise<{ id: string }>
}

async function attemptChallenge(challengeId: string, userId: string) {
  'use server'

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { status: true, prerequisiteChallengeId: true },
  })
  if (!challenge || challenge.status !== 'ACTIVE') return

  if (challenge.prerequisiteChallengeId) {
    const prereqDone = await prisma.attempt.findFirst({
      where: {
        userId,
        challengeId: challenge.prerequisiteChallengeId,
        status: 'APPROVED',
      },
    })
    if (!prereqDone) return
  }

  const attempt = await prisma.attempt.create({
    data: { userId, challengeId, status: 'DRAFT' },
  })

  redirect(`/attempt/${attempt.id}`)
}

export default async function ChallengePage({ params }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const { id } = await params
  const isReviewer = hasPermission(session.user.role, Permissions.CHALLENGES_APPROVE)

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, username: true, name: true, avatarUrl: true },
      },
      prerequisiteChallenge: {
        select: { id: true, title: true },
      },
      attempts: {
        where: { status: 'APPROVED' },
        include: {
          user: { select: { username: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!challenge || challenge.status === 'HIDDEN') {
    notFound()
  }

  const isCreator = challenge.creatorId === session.user.id
  const canView =
    challenge.status === 'ACTIVE' ||
    isCreator ||
    isReviewer

  if (!canView) {
    notFound()
  }

  const creatorInitials = challenge.creator.name
    ? challenge.creator.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : challenge.creator.username.substring(0, 2).toUpperCase()

  const attemptAction = attemptChallenge.bind(null, challenge.id, session.user.id)
  const categoryKey = challenge.category as ChallengeCategoryName
  const isActive = challenge.status === 'ACTIVE'

  let prerequisiteMet = true
  if (challenge.prerequisiteChallengeId) {
    const done = await prisma.attempt.findFirst({
      where: {
        userId: session.user.id,
        challengeId: challenge.prerequisiteChallengeId,
        status: 'APPROVED',
      },
    })
    prerequisiteMet = Boolean(done)
  }

  const canAttempt = isActive && prerequisiteMet

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {challenge.status !== 'ACTIVE' && (
                  <Badge
                    variant={
                      challenge.status === 'PENDING_REVIEW' ? 'secondary' : 'destructive'
                    }
                  >
                    {challenge.status === 'PENDING_REVIEW' ? 'Pending approval' : 'Rejected'}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl mb-2">{challenge.title}</CardTitle>
              <p className="text-muted-foreground">{challenge.description}</p>
            </div>
            <ReportDialog targetType="CHALLENGE" targetId={challenge.id} />
            <ShareButton title={challenge.title} url={challengeUrl(challenge.id)} />
          </div>
        </CardHeader>
        <CardContent>
          {challenge.prerequisiteChallenge && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm">
              <Link2 className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                {prerequisiteMet ? (
                  <>Prerequisite completed: {challenge.prerequisiteChallenge.title}</>
                ) : (
                  <>
                    Complete{' '}
                    <Link
                      href={`/challenge/${challenge.prerequisiteChallenge.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {challenge.prerequisiteChallenge.title}
                    </Link>{' '}
                    first to unlock this challenge.
                  </>
                )}
              </p>
            </div>
          )}

          {challenge.status === 'PENDING_REVIEW' && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p>
                  {challenge.aiReviewNote === 'AI review in progress…'
                    ? isCreator
                      ? 'AI is reviewing your challenge now.'
                      : 'This challenge is being reviewed before it goes live.'
                    : isCreator
                      ? 'Your challenge is waiting for moderator approval before others can attempt it.'
                      : 'This challenge is awaiting approval before it goes live.'}
                </p>
                {isCreator && challenge.aiReviewNote && challenge.aiReviewNote !== 'AI review in progress…' && (
                  <p className="mt-2 text-muted-foreground">
                    <span className="font-medium text-foreground">Review note:</span> {challenge.aiReviewNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {challenge.status === 'ACTIVE' && isCreator && challenge.aiReviewNote && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm">
              <Clock className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <p>
                <span className="font-medium">Approved.</span> {challenge.aiReviewNote}
              </p>
            </div>
          )}

          {challenge.status === 'REJECTED' && isCreator && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive mb-1">
                This challenge was not approved.
              </p>
              {challenge.aiReviewNote && (
                <p>
                  <span className="font-medium">Reason:</span> {challenge.aiReviewNote}
                </p>
              )}
              <p className="mt-2 text-muted-foreground">
                Edit and resubmit from Create if you&apos;d like to try again.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            <Badge className={CATEGORY_COLORS[categoryKey]}>
              {CATEGORY_LABELS[categoryKey]}
            </Badge>
            <Badge variant="secondary">
              {'★'.repeat(challenge.difficulty)} {challenge.difficulty}/5
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {challenge.points} points
            </Badge>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={challenge.creator.avatarUrl || undefined} />
                <AvatarFallback>{creatorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{challenge.creator.name || challenge.creator.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDistanceToNow(new Date(challenge.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            {canAttempt ? (
              <form action={attemptAction}>
                <Button size="lg" type="submit">
                  Attempt Challenge
                </Button>
              </form>
            ) : (
              <Button size="lg" disabled>
                {!prerequisiteMet
                  ? 'Complete prerequisite first'
                  : challenge.status === 'PENDING_REVIEW'
                    ? 'Awaiting approval'
                    : 'Unavailable'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Completions</CardTitle>
            <CardDescription>Friends and community members who completed this challenge</CardDescription>
          </CardHeader>
          <CardContent>
            {challenge.attempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Be the first to complete this challenge!
              </p>
            ) : (
              <div className="space-y-4">
                {challenge.attempts.map((attempt) => {
                  const userInitials = attempt.user.name
                    ? attempt.user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                    : attempt.user.username.substring(0, 2).toUpperCase()

                  return (
                    <div key={attempt.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={attempt.user.avatarUrl || undefined} />
                          <AvatarFallback>{userInitials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{attempt.user.name || attempt.user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Completed {formatDistanceToNow(new Date(attempt.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/attempt/${attempt.id}`}>View</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
