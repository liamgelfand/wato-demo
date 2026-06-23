import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  CreatedChallengeCard,
  type CreatedChallengeItem,
} from '../../components/ui/created-challenge-card'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchMyProfile } from '../../lib/api'
import { CATEGORY_LABELS, type ChallengeCategory } from '../../constants/categories'
import { colors, radius, spacing, typography } from '../../constants/theme'

type StatusFilter = 'ALL' | CreatedChallengeItem['status']
type CategoryFilter = 'ALL' | ChallengeCategory

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Live' },
  { key: 'PENDING_REVIEW', label: 'In review' },
  { key: 'REJECTED', label: 'Rejected' },
]

const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All types' },
  ...(
    Object.entries(CATEGORY_LABELS) as [ChallengeCategory, string][]
  ).map(([key, label]) => ({ key, label })),
]

export default function CreatedChallengesScreen() {
  const { token, loading: authLoading } = useAuthToken()
  const [items, setItems] = useState<CreatedChallengeItem[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (accessToken: string) => {
    const data = await fetchMyProfile(accessToken)
    setItems(data.created ?? [])
    if (!data.created?.length && (data.user?.createdCount ?? 0) > 0) {
      throw new Error('Server missing challenge list — run make docker-up to rebuild the API')
    }
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load challenges'))
      .finally(() => setLoading(false))
  }, [token, load])

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
        if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false
        return true
      }),
    [items, statusFilter, categoryFilter]
  )

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Created</Text>
        <View style={styles.back} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {STATUS_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setStatusFilter(opt.key)}
              style={[styles.chip, statusFilter === opt.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, statusFilter === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.filterLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CATEGORY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => setCategoryFilter(opt.key)}
              style={[styles.chip, categoryFilter === opt.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, categoryFilter === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
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
          <Text style={styles.empty}>
            {items.length === 0
              ? 'You have not created any challenges yet.'
              : 'No challenges match these filters.'}
          </Text>
        }
        renderItem={({ item }) => <CreatedChallengeCard challenge={item} />}
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
  title: { flex: 1, textAlign: 'center', ...typography.label, color: colors.foreground },
  error: {
    ...typography.caption,
    color: colors.destructive,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  filters: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.xs },
  filterLabel: { ...typography.caption, color: colors.mutedForeground, fontWeight: '600' },
  chipRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.foreground, fontWeight: '600' },
  chipTextActive: { color: colors.primaryForeground },
  list: { padding: spacing.md, flexGrow: 1 },
  empty: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingTop: spacing.xl,
  },
})
