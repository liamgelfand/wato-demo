import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Screen } from '../../components/ui/screen'
import { TabHeader } from '../../components/ui/tab-header'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchFeed } from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

type FriendActivity = {
  id: string
  user: { username: string; name: string | null }
  challenge: { id: string; title: string; points: number }
}

export default function FriendsTab() {
  const { token, loading: authLoading } = useAuthToken()
  const [activity, setActivity] = useState<FriendActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (accessToken: string) => {
    const data = await fetchFeed(accessToken, 'friends')
    setActivity(data.friendsActivity ?? [])
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, load])

  const onRefresh = async () => {
    if (!token) return
    setRefreshing(true)
    try {
      await load(token)
    } finally {
      setRefreshing(false)
    }
  }

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <TabHeader title="Friends" subtitle="Recent completions" />
      <FlatList
        data={activity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No friend activity yet</Text>
            <Text style={styles.emptyBody}>Add friends on the web app to see their completions here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/challenge/${item.challenge.id}`)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <Text style={styles.name}>{item.user.name ?? item.user.username}</Text>
            <Text style={styles.action}>
              completed <Text style={styles.challenge}>{item.challenge.title}</Text>
            </Text>
            <Text style={styles.points}>+{item.challenge.points} pts</Text>
          </Pressable>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: spacing.lg },
  emptyTitle: { ...typography.heading, fontSize: 18, color: colors.foreground, marginBottom: 6 },
  emptyBody: { ...typography.caption, color: colors.mutedForeground, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  name: { ...typography.label, color: colors.foreground },
  action: { ...typography.caption, color: colors.mutedForeground, marginTop: 4 },
  challenge: { color: colors.foreground, fontWeight: '600' },
  points: { ...typography.caption, color: colors.primary, marginTop: 6, fontWeight: '600' },
})
