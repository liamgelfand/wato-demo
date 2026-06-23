import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getExploreActivity } from '@/lib/explore-activity'
import { getRecommendedChallenges } from '@/lib/challenge-recommendations'
import { searchChallenges } from '@/lib/challenge-search'
import { FriendsActivityFeed } from '@/components/feed/friends-activity-feed'
import { ExploreSearch } from '@/components/explore/explore-search'
import { ChallengeCard } from '@/components/challenge/challenge-card'
import { Compass } from 'lucide-react'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

type ChallengeListItem = {
  id: string
  title: string
  description: string
  category: string
  difficulty: number
  points: number
  createdAt?: Date
  creator: {
    username: string
    name: string | null
    avatarUrl: string | null
  }
}

function ChallengeList({ challenges }: { challenges: ChallengeListItem[] }) {
  if (challenges.length === 0) {
    return <p className="text-sm text-muted-foreground">No challenges found.</p>
  }

  return (
    <div className="space-y-4">
      {challenges.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={{
            ...challenge,
            createdAt: challenge.createdAt ?? new Date(),
          }}
        />
      ))}
    </div>
  )
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const userId = session.user.id

  const [activity, recommendations, searchResults] = await Promise.all([
    getExploreActivity(userId),
    getRecommendedChallenges(userId),
    q.length >= 2 ? searchChallenges(q) : Promise.resolve([]),
  ])

  const searchChallengesList: ChallengeListItem[] = searchResults.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    points: c.points,
    difficulty: c.difficulty,
    createdAt: c.createdAt,
    creator: c.creator,
  }))

  const recommendationList: ChallengeListItem[] = recommendations.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    points: c.points,
    difficulty: c.difficulty,
    creator: c.creator,
  }))

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Compass className="h-8 w-8 text-primary" />
          Explore
        </h1>
        <p className="text-muted-foreground">
          Discover completions, search challenges, and find ones you might like
        </p>
      </div>

      <Suspense fallback={null}>
        <ExploreSearch />
      </Suspense>

      {q.length >= 2 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-1">Search results</h2>
          <p className="text-sm text-muted-foreground mb-4">Matches for “{q}”</p>
          <ChallengeList challenges={searchChallengesList} />
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-1">People you might know</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Recent completions from suggested users
        </p>
        <FriendsActivityFeed
          attempts={activity}
          emptyTitle="No completions from suggested users yet"
          emptyDescription="As more people finish challenges, their activity will appear here."
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">Challenges you might like</h2>
        <p className="text-sm text-muted-foreground mb-4">Based on what you have done</p>
        <ChallengeList challenges={recommendationList} />
      </section>
    </div>
  )
}
