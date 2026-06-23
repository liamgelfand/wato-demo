const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

async function parseApiError(res: Response, fallback: string): Promise<never> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `${fallback} (${res.status})`)
  }
  if (res.status === 404) {
    throw new Error('API endpoint missing — run make docker-up to rebuild the server')
  }
  throw new Error(`${fallback} (${res.status})`)
}

export async function mobileLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Login failed')
  return res.json()
}

export async function fetchFeed(
  accessToken: string,
  tab: 'activity' | 'challenges' | 'friends' = 'activity'
) {
  const res = await fetch(`${API_URL}/api/feed?tab=${tab}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Feed failed')
  return res.json()
}

/** Activity feed with fallback for older API builds that lack tab=activity. */
export async function fetchFeedActivity(accessToken: string) {
  const data = await fetchFeed(accessToken, 'activity')
  if (Array.isArray(data.activity) && data.activity.length > 0) {
    return data.activity
  }
  if (data.tab === 'activity' && Array.isArray(data.activity)) {
    return data.activity
  }
  // Legacy server treated unknown tabs as "challenges"
  if (data.tab === 'challenges' || !data.activity) {
    const friendsData = await fetchFeed(accessToken, 'friends')
    if (Array.isArray(friendsData.friendsActivity)) {
      return friendsData.friendsActivity.map((item: Record<string, unknown>) => ({
        ...item,
        source: 'friend',
      }))
    }
  }
  return data.activity ?? []
}

export async function fetchExplore(accessToken: string, query?: string) {
  const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
  const res = await fetch(`${API_URL}/api/explore${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Explore failed')
  return res.json()
}

export async function fetchTrending(accessToken: string) {
  const res = await fetch(`${API_URL}/api/challenges/trending`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Trending failed')
  return res.json()
}

export async function fetchFriends(accessToken: string) {
  const res = await fetch(`${API_URL}/api/friends`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load friends')
  return res.json() as Promise<{
    friends: Array<{ id: string; username: string; name: string | null }>
  }>
}

export async function createMessageThread(accessToken: string, friendId: string) {
  const res = await fetch(`${API_URL}/api/messages/create-thread`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ friendId }),
  })
  if (!res.ok) await parseApiError(res, 'Could not start conversation')
  return res.json() as Promise<{ threadId: string }>
}

export async function fetchMessageThreads(accessToken: string) {
  const res = await fetch(`${API_URL}/api/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Messages failed')
  return res.json()
}

export async function fetchMessageThread(accessToken: string, threadId: string) {
  const res = await fetch(`${API_URL}/api/messages/${threadId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load conversation')
  return res.json()
}

export async function sendMessage(accessToken: string, threadId: string, body: string) {
  const res = await fetch(`${API_URL}/api/messages/${threadId}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  })
  if (!res.ok) await parseApiError(res, 'Could not send message')
  return res.json()
}

export async function fetchChallenge(accessToken: string, challengeId: string) {
  const res = await fetch(`${API_URL}/api/challenges/${challengeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load challenge')
  return res.json()
}

export async function startChallengeAttempt(accessToken: string, challengeId: string) {
  const res = await fetch(`${API_URL}/api/challenges/${challengeId}/attempt`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not start challenge')
  return res.json() as Promise<{ attemptId: string }>
}

export async function uploadProof(
  accessToken: string,
  attemptId: string,
  media: import('./pick-media').PickedMedia
) {
  const { buildUploadForm } = await import('./upload')
  const form = buildUploadForm(media, { attemptId })
  const res = await fetch(`${API_URL}/api/attempts/upload-proof`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) await parseApiError(res, 'Could not upload proof')
  return res.json() as Promise<{ success: boolean }>
}

export async function uploadAvatar(
  accessToken: string,
  media: import('./pick-media').PickedMedia
) {
  const { buildUploadForm } = await import('./upload')
  const form = buildUploadForm(media, {})
  const res = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  if (!res.ok) await parseApiError(res, 'Could not upload photo')
  return res.json() as Promise<{ user: { avatarUrl: string | null } }>
}

export type CreateChallengeInput = {
  title: string
  description: string
  category: string
  difficulty: number
}

export async function createChallenge(accessToken: string, input: CreateChallengeInput) {
  const res = await fetch(`${API_URL}/api/challenges/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = (await res.json()) as { error?: string; errors?: string[] }
      if (body.errors?.length) throw new Error(body.errors[0])
      throw new Error(body.error ?? 'Could not create challenge')
    }
    await parseApiError(res, 'Could not create challenge')
  }
  return res.json() as Promise<{ id: string }>
}

export async function fetchMyProfile(accessToken: string) {
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load profile')
  return res.json()
}

export async function updateMyProfile(
  accessToken: string,
  data: { name?: string; bio?: string }
) {
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) await parseApiError(res, 'Could not update profile')
  return res.json()
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function fetchAttempt(accessToken: string, attemptId: string) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load post')
  return res.json()
}

export async function upvoteAttempt(accessToken: string, attemptId: string) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/upvote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not like post')
  return res.json() as Promise<{ upvoted: boolean; count: number }>
}

export async function commentOnAttempt(
  accessToken: string,
  attemptId: string,
  body: string,
  parentId?: string
) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body, parentId }),
  })
  if (!res.ok) await parseApiError(res, 'Could not comment')
  return res.json()
}

export async function upvoteComment(accessToken: string, commentId: string) {
  const res = await fetch(`${API_URL}/api/attempts/comments/${commentId}/upvote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not like comment')
  return res.json() as Promise<{ upvoted: boolean; count: number }>
}

export async function reactToAttempt(
  accessToken: string,
  attemptId: string,
  type: string
) {
  const res = await fetch(`${API_URL}/api/attempts/${attemptId}/reaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  })
  if (!res.ok) await parseApiError(res, 'Could not react')
  return res.json()
}

export async function registerPushToken(accessToken: string, token: string, platform: string) {
  await fetch(`${API_URL}/api/devices`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, platform }),
  })
}

export type SocialUser = {
  id: string
  username: string
  name: string | null
  avatarUrl: string | null
}

export async function fetchSocialList(
  accessToken: string,
  type: 'friends' | 'followers' | 'following'
) {
  const res = await fetch(`${API_URL}/api/users/me/social?type=${type}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load list')
  return res.json() as Promise<{ type: string; users: SocialUser[] }>
}

export async function fetchModerationQueue(accessToken: string) {
  const res = await fetch(`${API_URL}/api/moderation/queue`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) await parseApiError(res, 'Could not load review queue')
  return res.json() as Promise<{
    pendingAttempts: Array<{
      id: string
      proofUrl: string | null
      proofType: string | null
      createdAt: string
      user: SocialUser
      challenge: { id: string; title: string; points: number; category: string }
    }>
    pendingChallenges: Array<{
      id: string
      title: string
      description: string
      category: string
      points: number
      difficulty: number
      aiReviewNote: string | null
      createdAt: string
      creator: SocialUser
    }>
  }>
}

export async function moderateAttempt(
  accessToken: string,
  attemptId: string,
  action: 'approve' | 'reject'
) {
  const res = await fetch(`${API_URL}/api/moderation/attempts/${attemptId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  })
  if (!res.ok) await parseApiError(res, 'Could not review attempt')
  return res.json()
}

export async function moderateChallenge(
  accessToken: string,
  challengeId: string,
  action: 'approve' | 'reject'
) {
  const res = await fetch(`${API_URL}/api/moderation/challenges/${challengeId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  })
  if (!res.ok) await parseApiError(res, 'Could not review challenge')
  return res.json()
}

export { API_URL }
