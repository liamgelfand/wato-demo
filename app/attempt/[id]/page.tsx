import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canViewAttempt } from '@/lib/attempt-access'
import { canEngageOnAttempt } from '@/lib/attempt-engagement'
import { hasPermission, Permissions } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProofUploader } from '@/components/attempt/proof-uploader'
import { ProofDisplay } from '@/components/attempt/proof-display'
import { AttemptEngagement } from '@/components/attempt/attempt-engagement'
import { ReportDialog } from '@/components/moderation/report-dialog'
import { Trophy } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { AttemptReactionType } from '@prisma/client'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AttemptPage({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/login')
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      user: { select: { isPrivate: true } },
      challenge: {
        include: {
          creator: {
            select: { username: true, name: true },
          },
        },
      },
      verificationVotes: {
        include: {
          voter: {
            select: { username: true, name: true, role: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { username: true, name: true, avatarUrl: true } },
        },
      },
      upvotes: { select: { userId: true } },
      reactions: { select: { type: true, userId: true } },
    },
  })

  if (!attempt) {
    notFound()
  }

  const allowed = await canViewAttempt(
    session.user.id,
    {
      userId: attempt.userId,
      status: attempt.status,
      ownerIsPrivate: attempt.user.isPrivate,
    },
    session.user.role
  )

  if (!allowed) {
    redirect('/')
  }

  const isOwner = attempt.userId === session.user.id
  const isReviewer = hasPermission(session.user.role, Permissions.ATTEMPTS_VERIFY)
  const showEngagement = canEngageOnAttempt(attempt.status) && Boolean(attempt.proofUrl)

  const upvoteCount = attempt.upvotes.length
  const userUpvoted = attempt.upvotes.some((u) => u.userId === session.user.id)
  const userReaction =
    attempt.reactions.find((r) => r.userId === session.user.id)?.type ?? null
  const reactionCounts = attempt.reactions.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1
      return acc
    },
    {} as Partial<Record<AttemptReactionType, number>>
  )

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={
                attempt.status === 'APPROVED' ? 'default' :
                attempt.status === 'PENDING' ? 'secondary' :
                attempt.status === 'REJECTED' ? 'destructive' : 'outline'
              }>
                {attempt.status}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {attempt.challenge.points} points
              </Badge>
            </div>
            <ReportDialog targetType="ATTEMPT" targetId={attempt.id} />
          </div>
          <CardTitle>{attempt.challenge.title}</CardTitle>
          <CardDescription>{attempt.challenge.description}</CardDescription>
        </CardHeader>
      </Card>

      {attempt.status === 'DRAFT' && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Proof</CardTitle>
            <CardDescription>
              Upload a photo or video showing you completing this challenge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProofUploader attemptId={attempt.id} />
          </CardContent>
        </Card>
      )}

      {attempt.status === 'PENDING' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Review</CardTitle>
            <CardDescription>
              {isOwner
                ? 'The Wato team is reviewing your submission. Friends can cheer you on below!'
                : 'This submission is waiting for moderator approval.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempt.proofUrl && (
              <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                <ProofDisplay proofUrl={attempt.proofUrl} proofType={attempt.proofType} />
              </div>
            )}

            {attempt.verificationVotes.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="font-medium text-sm">Moderator review</p>
                <ul className="space-y-1">
                  {attempt.verificationVotes.map((vote) => (
                    <li key={vote.id} className="text-sm">
                      <Badge variant={vote.vote === 'VERIFY' ? 'default' : 'destructive'}>
                        {vote.vote}
                      </Badge>{' '}
                      by {vote.voter.name || vote.voter.username}
                      {vote.reason && `: ${vote.reason}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isReviewer && !isOwner && (
              <Button asChild className="w-full mb-4">
                <Link href={`/attempt/${attempt.id}/verify`}>Review submission</Link>
              </Button>
            )}

            {showEngagement && (
              <AttemptEngagement
                attemptId={attempt.id}
                initialUpvoteCount={upvoteCount}
                initialUserUpvoted={userUpvoted}
                initialComments={attempt.comments.map((c) => ({
                  ...c,
                  createdAt: c.createdAt.toISOString(),
                }))}
                initialReactionCounts={reactionCounts}
                initialUserReaction={userReaction}
              />
            )}
          </CardContent>
        </Card>
      )}

      {attempt.status === 'APPROVED' && (
        <Card>
          <CardHeader>
            <CardTitle>Challenge Completed!</CardTitle>
            <CardDescription>
              This attempt has been verified and approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempt.proofUrl && (
              <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                <ProofDisplay proofUrl={attempt.proofUrl} proofType={attempt.proofType} />
              </div>
            )}
            <p className="text-lg font-semibold text-success mb-4">
              +{attempt.challenge.points} points earned!
            </p>

            {showEngagement && (
              <AttemptEngagement
                attemptId={attempt.id}
                initialUpvoteCount={upvoteCount}
                initialUserUpvoted={userUpvoted}
                initialComments={attempt.comments.map((c) => ({
                  ...c,
                  createdAt: c.createdAt.toISOString(),
                }))}
                initialReactionCounts={reactionCounts}
                initialUserReaction={userReaction}
              />
            )}
          </CardContent>
        </Card>
      )}

      {attempt.status === 'REJECTED' && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Attempt Rejected</CardTitle>
            <CardDescription>
              This attempt did not meet the challenge requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempt.proofUrl && (
              <div className="mb-4 rounded-lg overflow-hidden bg-muted">
                <ProofDisplay proofUrl={attempt.proofUrl} proofType={attempt.proofType} />
              </div>
            )}

            <div className="space-y-2 mb-4">
              <p className="font-medium">Feedback</p>
              {attempt.verificationVotes
                .filter((v) => v.vote === 'REJECT')
                .map((vote) => (
                  <p key={vote.id} className="text-sm text-muted-foreground">
                    • {vote.reason || 'No reason provided'}
                  </p>
                ))}
            </div>

            <Button asChild variant="outline">
              <Link href={`/challenge/${attempt.challengeId}`}>
                Try Again
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
