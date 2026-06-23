import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ActivityCard, type ActivityItem } from '../../components/feed/activity-card'
import { FeedBrandHeader } from '../../components/feed/feed-brand-header'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchFeedActivity } from '../../lib/api'
import { colors, spacing, typography } from '../../constants/theme'

export default function FeedTab() {
  const { token, loading: authLoading } = useAuthToken()
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollY = useRef(new Animated.Value(0)).current

  const load = useCallback(async (accessToken: string) => {
    setError(null)
    const items = await fetchFeedActivity(accessToken)
    setActivity(items)
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load feed'))
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Animated.FlatList
        data={activity}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <FeedBrandHeader scrollY={scrollY} onCreate={() => router.push('/create')} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyBody}>
              When friends and other users complete challenges, their wins show up here.
            </Text>
          </View>
        }
        renderItem={({ item }) => <ActivityCard item={item} />}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  error: {
    ...typography.caption,
    color: colors.destructive,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    fontSize: 18,
    color: colors.foreground,
    marginBottom: 6,
  },
  emptyBody: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
})
