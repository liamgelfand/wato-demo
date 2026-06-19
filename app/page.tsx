import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFriendIds } from '@/lib/friends'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'
import { ChallengeCard } from '@/components/challenge/challenge-card'
import { CategoryFilter } from '@/components/challenge/category-filter'
import { FriendsActivityFeed } from '@/components/feed/friends-activity-feed'
import { FeedTabs } from '@/components/feed/feed-tabs'
import { ModQueuesPanel } from '@/components/feed/mod-queues-panel'
import { hasPermission, Permissions } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusCircle } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ category?: string; tab?: string }>
}

function FilterSkeleton() {
  return <Skeleton className="h-10 w-[200px]" />
}

function ModQueuesSkeleton() {
  return <Skeleton className="h-24 w-full mb-6" />
}

async function ChallengesPanel({
  userId,
  category,
  isReviewer,
}: {
  userId: string
  category: string
  isReviewer: boolean
}) {
  const [challenges, completedChallengeIds] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        status: 'ACTIVE',
        ...excludeTestChallengesWhere,
        ...(category !== 'ALL' && {
          category: category as 'FITNESS' | 'SKILL' | 'CREATIVITY' | 'ADVENTURE' | 'FUNNY',
        }),
      },
      include: {
        creator: {
          select: { username: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.attempt.findMany({
      where: { userId, status: 'APPROVED' },
      select: { challengeId: true },
    }),
  ])

  const completedIds = new Set(completedChallengeIds.map((a) => a.challengeId))
  const challengesToDo = challenges.filter((c) => !completedIds.has(c.id))

  return (
    <>
      {isReviewer && (
        <Suspense fallback={<ModQueuesSkeleton />}>
          <ModQueuesPanel userId={userId} />
        </Suspense>
      )}

      <div className="mb-6">
        <Suspense fallback={<FilterSkeleton />}>
          <CategoryFilter currentCategory={category} />
        </Suspense>
      </div>

      {challengesToDo.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {challenges.length === 0
              ? 'No challenges found in this category.'
              : "You've completed all challenges in this category. Nice work!"}
          </p>
          <Button asChild>
            <Link href="/create">Create a new challenge</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {challengesToDo.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}
    </>
  )
}

async function FriendsPanel({ userId }: { userId: string }) {
  const friendIds = await getFriendIds(userId)

  const friendsActivity =
    friendIds.length > 0
      ? await prisma.attempt.findMany({
          where: {
            userId: { in: friendIds },
            status: 'APPROVED',
          },
          include: {
            user: { select: { username: true, name: true, avatarUrl: true } },
            challenge: { select: { id: true, title: true, points: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 20,
        })
      : []

  return <FriendsActivityFeed attempts={friendsActivity} />
}

export default async function HomePage({ searchParams }: PageProps) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const params = await searchParams
  const category = params.category || 'ALL'
  const tab = params.tab === 'friends' ? 'friends' : 'challenges'
  const userId = session.user.id
  const isReviewer = hasPermission(session.user.role, Permissions.ATTEMPTS_VERIFY)

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wato</h1>
          <p className="text-muted-foreground">
            Pick a challenge or see what friends have completed
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Challenge
          </Link>
        </Button>
      </div>

      <FeedTabs
        initialTab={tab}
        category={category}
        challengesPanel={
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ChallengesPanel
              userId={userId}
              category={category}
              isReviewer={isReviewer}
            />
          </Suspense>
        }
        friendsPanel={
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <FriendsPanel userId={userId} />
          </Suspense>
        }
      />
    </div>
  )
}
