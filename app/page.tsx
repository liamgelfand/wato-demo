import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getFriendIds } from '@/lib/friends'
import { ChallengeCard } from '@/components/challenge/challenge-card'
import { CategoryFilter } from '@/components/challenge/category-filter'
import { FriendsActivityFeed } from '@/components/feed/friends-activity-feed'
import { ModReviewQueue } from '@/components/feed/mod-review-queue'
import { hasPermission, Permissions } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<{ category?: string; tab?: string }>
}

function FilterSkeleton() {
  return <Skeleton className="h-10 w-[200px]" />
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

  const friendIds = await getFriendIds(userId)

  const isReviewer = hasPermission(session.user.role, Permissions.ATTEMPTS_VERIFY)

  const [challenges, completedChallengeIds, pendingReviews, friendsActivity] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        status: 'ACTIVE',
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
    isReviewer
      ? prisma.attempt.findMany({
          where: { status: 'PENDING' },
          include: {
            user: { select: { username: true, name: true, avatarUrl: true } },
            challenge: { select: { title: true, points: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        })
      : Promise.resolve([]),
    friendIds.length > 0
      ? prisma.attempt.findMany({
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
      : Promise.resolve([]),
  ])

  const completedIds = new Set(completedChallengeIds.map((a) => a.challengeId))
  const challengesToDo = challenges.filter((c) => !completedIds.has(c.id))

  const tabHref = (nextTab: string) => {
    const query = new URLSearchParams()
    query.set('tab', nextTab)
    if (category !== 'ALL') query.set('category', category)
    return `/?${query.toString()}`
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wato</h1>
          <p className="text-muted-foreground">
            {tab === 'friends'
              ? 'See what your friends have completed'
              : 'Pick a challenge and prove you did it'}
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Challenge
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg w-fit">
        <Link
          href={tabHref('challenges')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'challenges'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Challenges to Do
        </Link>
        <Link
          href={tabHref('friends')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'friends'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Friends Activity
        </Link>
      </div>

      {tab === 'challenges' ? (
        <>
          <ModReviewQueue attempts={pendingReviews} />

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
      ) : (
        <FriendsActivityFeed attempts={friendsActivity} />
      )}
    </div>
  )
}
