import { prisma } from '@/lib/db'
import { getFollowerIds, getFollowingIds } from '@/lib/follows'

async function getAcceptedFriendshipIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  })

  return friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId))
}

/** Users who follow each other, plus legacy accepted friendships. */
export async function getMutualFollowIds(userId: string): Promise<string[]> {
  const [following, followers] = await Promise.all([
    getFollowingIds(userId),
    getFollowerIds(userId),
  ])
  const followerSet = new Set(followers)
  return following.filter((id) => followerSet.has(id))
}

export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  if (userIdA === userIdB) return true

  const [mutual, friendship] = await Promise.all([
    getMutualFollowIds(userIdA).then((ids) => ids.includes(userIdB)),
    prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: userIdA, addresseeId: userIdB },
          { requesterId: userIdB, addresseeId: userIdA },
        ],
      },
      select: { id: true },
    }),
  ])

  return mutual || Boolean(friendship)
}

export async function getFriendIds(userId: string): Promise<string[]> {
  const [mutual, legacy] = await Promise.all([
    getMutualFollowIds(userId),
    getAcceptedFriendshipIds(userId),
  ])
  return [...new Set([...mutual, ...legacy])]
}

export type SocialUser = {
  id: string
  username: string
  name: string | null
  avatarUrl: string | null
}

export async function getFriendsList(userId: string): Promise<SocialUser[]> {
  const friendIds = await getFriendIds(userId)
  if (friendIds.length === 0) return []

  return prisma.user.findMany({
    where: { id: { in: friendIds } },
    select: { id: true, username: true, name: true, avatarUrl: true },
    orderBy: { username: 'asc' },
  })
}

export async function getFollowersList(userId: string): Promise<SocialUser[]> {
  const ids = await getFollowerIds(userId)
  if (ids.length === 0) return []

  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, username: true, name: true, avatarUrl: true },
    orderBy: { username: 'asc' },
  })
}

export async function getFollowingList(userId: string): Promise<SocialUser[]> {
  const ids = await getFollowingIds(userId)
  if (ids.length === 0) return []

  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, username: true, name: true, avatarUrl: true },
    orderBy: { username: 'asc' },
  })
}

export async function getSocialCounts(userId: string) {
  const [friends, followers, following] = await Promise.all([
    getFriendIds(userId),
    getFollowerIds(userId),
    getFollowingIds(userId),
  ])

  return {
    friendsCount: friends.length,
    followersCount: followers.length,
    followingCount: following.length,
  }
}
