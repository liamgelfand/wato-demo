import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getFeedActivity } from '@/lib/feed-activity'
import { FriendsActivityFeed } from '@/components/feed/friends-activity-feed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlusCircle, Zap } from 'lucide-react'

async function ActivityPanel({ userId }: { userId: string }) {
  const activity = await getFeedActivity(userId)
  return <FriendsActivityFeed attempts={activity} />
}

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const userId = session.user.id

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Wato
          </h1>
          <p className="text-muted-foreground">
            Completed challenges from friends and the community
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Challenge
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <ActivityPanel userId={userId} />
      </Suspense>

      <p className="text-sm text-muted-foreground text-center mt-8">
        Looking for new challenges?{' '}
        <Link href="/explore" className="text-primary font-medium hover:underline">
          Explore recommendations
        </Link>
      </p>
    </div>
  )
}
