import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { getFriendsList } from '@/lib/friends'

export async function GET(request: Request) {
  const user = await getApiUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const friends = await getFriendsList(user.id)

  return NextResponse.json({ friends })
}
