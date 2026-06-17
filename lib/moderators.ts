import { prisma } from '@/lib/db'

export async function getModeratorUserIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MODERATOR'] } },
    select: { id: true },
  })
  return users.map((u) => u.id)
}
