import { prisma } from '@/lib/db'

export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA },
      ],
    },
    select: { id: true },
  })

  return Boolean(friendship)
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  })

  return friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId))
}
