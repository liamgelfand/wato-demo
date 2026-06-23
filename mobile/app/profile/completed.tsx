import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ChallengeCard, type ChallengeItem } from '../../components/ui/challenge-card'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchMyProfile } from '../../lib/api'
import { colors, spacing, typography } from '../../constants/theme'

type CompletedItem = {
  attemptId: string
  pointsEarned: number
  challenge: ChallengeItem
}

export default function CompletedChallengesScreen() {
  const { token, loading: authLoading } = useAuthToken()
  const [items, setItems] = useState<CompletedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (accessToken: string) => {
    const data = await fetchMyProfile(accessToken)
    setItems(data.completed ?? [])
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, load])

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Completed</Text>
        <View style={styles.back} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.attemptId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              if (!token) return
              setRefreshing(true)
              try {
                await load(token)
              } finally {
                setRefreshing(false)
              }
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No completed challenges yet. Finish one to earn points.</Text>
        }
        renderItem={({ item }) => (
          <View>
            <ChallengeCard challenge={item.challenge} />
            <Text style={styles.points}>+{item.pointsEarned} pts earned</Text>
          </View>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    textAlign: 'center',
    ...typography.label,
    color: colors.foreground,
  },
  list: { padding: spacing.md, flexGrow: 1 },
  points: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  empty: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
})
