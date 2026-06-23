import { prisma } from '@/lib/db'
import { excludeTestChallengesWhere } from '@/lib/public-challenges'

export async function searchChallenges(query: string, limit = 20) {
  const q = query.trim()
  if (q.length < 2) return []

  return prisma.challenge.findMany({
    where: {
      status: 'ACTIVE',
      ...excludeTestChallengesWhere,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: {
      creator: { select: { username: true, name: true, avatarUrl: true } },
      _count: { select: { attempts: { where: { status: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
