import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import {
  getFollowersList,
  getFollowingList,
  getFriendsList,
} from '@/lib/friends'

const VALID_TYPES = new Set(['friends', 'followers', 'following'])

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'friends'

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  let users
  if (type === 'followers') {
    users = await getFollowersList(user.id)
  } else if (type === 'following') {
    users = await getFollowingList(user.id)
  } else {
    users = await getFriendsList(user.id)
  }

  return NextResponse.json({ type, users })
}
