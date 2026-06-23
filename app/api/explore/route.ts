import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { getExploreActivity } from '@/lib/explore-activity'
import { getRecommendedChallenges } from '@/lib/challenge-recommendations'
import { searchChallenges } from '@/lib/challenge-search'
import { getTrendingChallenges } from '@/lib/trending'

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  const [activity, recommendations, trending, searchResults] = await Promise.all([
    getExploreActivity(user.id),
    getRecommendedChallenges(user.id),
    getTrendingChallenges(12),
    q.length >= 2 ? searchChallenges(q) : Promise.resolve([]),
  ])

  return NextResponse.json({
    activity,
    recommendations,
    trending,
    search: searchResults.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      points: c.points,
      difficulty: c.difficulty,
      completionCount: c._count.attempts,
      creator: c.creator,
    })),
    query: q || null,
  })
}
