import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ActivityCard, type ActivityItem } from '../../components/feed/activity-card'
import { ChallengeCard, type ChallengeItem } from '../../components/ui/challenge-card'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchExplore, fetchTrending } from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

type ExploreSection =
  | { key: string; type: 'header'; title: string; subtitle?: string }
  | { key: string; type: 'activity'; item: ActivityItem }
  | { key: string; type: 'challenge'; item: ChallengeItem }

function toChallengeItem(c: {
  id: string
  title: string
  description: string
  category: string
  points: number
  difficulty: number
  creator: { username: string; name: string | null; avatarUrl?: string | null }
}): ChallengeItem {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    points: c.points,
    difficulty: c.difficulty,
    creator: c.creator,
  }
}

export default function ExploreTab() {
  const { token, loading: authLoading } = useAuthToken()
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [recommendations, setRecommendations] = useState<ChallengeItem[]>([])
  const [searchResults, setSearchResults] = useState<ChallengeItem[]>([])
  const [query, setQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (accessToken: string, q?: string) => {
    setError(null)
    try {
      const data = await fetchExplore(accessToken, q)
      setActivity(data.activity ?? [])
      setRecommendations((data.recommendations ?? []).map(toChallengeItem))
      setSearchResults((data.search ?? []).map(toChallengeItem))
      setQuery(data.query ?? q ?? '')
    } catch (exploreErr) {
      const trending = await fetchTrending(accessToken)
      setActivity([])
      setRecommendations((trending.challenges ?? []).map(toChallengeItem))
      setSearchResults([])
      setQuery(q ?? '')
      const msg = exploreErr instanceof Error ? exploreErr.message : ''
      if (msg.includes('404') || msg.includes('API endpoint missing')) {
        setError('Explore API outdated — run make docker-up on your PC, then pull to refresh.')
      } else {
        throw exploreErr
      }
    }
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load explore'))
      .finally(() => setLoading(false))
  }, [token, load])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => {
      load(token, searchInput).catch(() => {})
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput, token, load])

  const onRefresh = async () => {
    if (!token) return
    setRefreshing(true)
    try {
      await load(token, searchInput)
    } finally {
      setRefreshing(false)
    }
  }

  const sections = useMemo(() => {
    const rows: ExploreSection[] = []

    if (query.length >= 2) {
      rows.push({
        key: 'search-header',
        type: 'header',
        title: 'Search results',
        subtitle: `Matches for “${query}”`,
      })
      for (const item of searchResults) {
        rows.push({ key: `search-${item.id}`, type: 'challenge', item })
      }
      if (searchResults.length === 0) {
        rows.push({
          key: 'search-empty',
          type: 'header',
          title: 'No challenges found',
          subtitle: 'Try a different search term',
        })
      }
    }

    rows.push({
      key: 'activity-header',
      type: 'header',
      title: 'Discover completions',
      subtitle: 'From people outside your friend list',
    })
    for (const item of activity) {
      rows.push({ key: `activity-${item.id}`, type: 'activity', item })
    }
    if (activity.length === 0) {
      rows.push({
        key: 'activity-empty',
        type: 'header',
        title: 'No completions to discover yet',
        subtitle: 'Friend activity appears on Feed; new users show up here',
      })
    }

    rows.push({
      key: 'rec-header',
      type: 'header',
      title: 'Challenges you might like',
      subtitle: 'Trending and matched to your interests',
    })
    for (const item of recommendations) {
      rows.push({ key: `rec-${item.id}`, type: 'challenge', item })
    }
    if (recommendations.length === 0) {
      rows.push({
        key: 'rec-empty',
        type: 'header',
        title: 'No recommendations yet',
        subtitle: 'Complete a challenge or rebuild the API server',
      })
    }

    return rows
  }, [activity, recommendations, searchResults, query])

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.searchField}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search challenges"
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchInput.length > 0 ? (
            <Pressable onPress={() => setSearchInput('')} hitSlop={8} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={styles.sectionSubtitle}>{item.subtitle}</Text> : null}
              </View>
            )
          }
          if (item.type === 'activity') {
            return <ActivityCard item={item.item} />
          }
          return <ChallengeCard challenge={item.item} />
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 34,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    ...typography.body,
    fontSize: 16,
    lineHeight: Platform.OS === 'ios' ? 20 : 22,
    color: colors.foreground,
    paddingVertical: 0,
    margin: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {}),
  },
  clearBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.destructive,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  list: { padding: spacing.md, flexGrow: 1 },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 18,
    color: colors.foreground,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: 4,
  },
})
