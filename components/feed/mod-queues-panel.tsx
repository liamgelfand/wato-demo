import { prisma } from '@/lib/db'
import { ModReviewQueue } from '@/components/feed/mod-review-queue'
import { ModChallengeReviewQueue } from '@/components/feed/mod-challenge-review-queue'

interface ModQueuesPanelProps {
  userId: string
}

export async function ModQueuesPanel({ userId }: ModQueuesPanelProps) {
  const [pendingReviews, pendingChallenges] = await Promise.all([
    prisma.attempt.findMany({
      where: {
        status: 'PENDING',
        userId: { not: userId },
      },
      include: {
        user: { select: { username: true, name: true, avatarUrl: true } },
        challenge: { select: { title: true, points: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    prisma.challenge.findMany({
      where: {
        status: 'PENDING_REVIEW',
        creatorId: { not: userId },
      },
      include: {
        creator: { select: { username: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return (
    <>
      <ModChallengeReviewQueue challenges={pendingChallenges} />
      <ModReviewQueue attempts={pendingReviews} />
    </>
  )
}
