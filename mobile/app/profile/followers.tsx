import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { Screen } from '../../components/ui/screen'
import { SocialListScreen } from '../../components/profile/social-user-list'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchSocialList } from '../../lib/api'

export default function FollowersScreen() {
  const { token, loading: authLoading } = useAuthToken()
  const [users, setUsers] = useState<Awaited<ReturnType<typeof fetchSocialList>>['users']>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetchSocialList(token, 'followers')
      .then((data) => setUsers(data.users))
      .finally(() => setLoading(false))
  }, [token])

  if (authLoading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <SocialListScreen
        title="Followers"
        users={users}
        loading={loading}
        emptyMessage="Nobody is following you yet."
        onBack={() => router.back()}
      />
    </Screen>
  )
}
