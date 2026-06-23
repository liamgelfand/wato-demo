import { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ProofMedia } from '../../components/media/proof-media'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import {
  fetchModerationQueue,
  moderateAttempt,
  moderateChallenge,
  resolveMediaUrl,
} from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

export default function ReviewScreen() {
  const { token, loading: authLoading } = useAuthToken()
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof fetchModerationQueue>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async (accessToken: string) => {
    setError(null)
    const data = await fetchModerationQueue(accessToken)
    setQueue(data)
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load queue'))
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

  const reviewAttempt = async (id: string, action: 'approve' | 'reject') => {
    if (!token) return
    setActing(`attempt-${id}-${action}`)
    try {
      await moderateAttempt(token, id, action)
      await load(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setActing(null)
    }
  }

  const reviewChallenge = async (id: string, action: 'approve' | 'reject') => {
    if (!token) return
    setActing(`challenge-${id}-${action}`)
    try {
      await moderateChallenge(token, id, action)
      await load(token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setActing(null)
    }
  }

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Review queue</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionTitle}>
          Challenge submissions ({queue?.pendingChallenges.length ?? 0})
        </Text>
        {queue?.pendingChallenges.length === 0 ? (
          <Text style={styles.empty}>No challenges waiting for approval.</Text>
        ) : (
          queue?.pendingChallenges.map((challenge) => (
            <View key={challenge.id} style={styles.card}>
              <Text style={styles.cardTitle}>{challenge.title}</Text>
              <Text style={styles.cardMeta}>
                by @{challenge.creator.username} · {challenge.points} pts
              </Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {challenge.description}
              </Text>
              {challenge.aiReviewNote ? (
                <Text style={styles.note}>{challenge.aiReviewNote}</Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.approveBtn, acting === `challenge-${challenge.id}-approve` && styles.disabled]}
                  onPress={() => reviewChallenge(challenge.id, 'approve')}
                  disabled={!!acting}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.rejectBtn, acting === `challenge-${challenge.id}-reject` && styles.disabled]}
                  onPress={() => reviewChallenge(challenge.id, 'reject')}
                  disabled={!!acting}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>
          Proof submissions ({queue?.pendingAttempts.length ?? 0})
        </Text>
        {queue?.pendingAttempts.length === 0 ? (
          <Text style={styles.empty}>No proof submissions waiting for review.</Text>
        ) : (
          queue?.pendingAttempts.map((attempt) => {
            const proofUri = resolveMediaUrl(attempt.proofUrl)
            return (
              <View key={attempt.id} style={styles.card}>
                <Text style={styles.cardTitle}>{attempt.challenge.title}</Text>
                <Text style={styles.cardMeta}>
                  by @{attempt.user.username} · {attempt.challenge.points} pts
                </Text>
                {proofUri ? (
                  <ProofMedia
                    uri={proofUri}
                    proofType={attempt.proofType}
                    style={styles.proof}
                  />
                ) : (
                  <Text style={styles.note}>No proof media attached</Text>
                )}
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.approveBtn, acting === `attempt-${attempt.id}-approve` && styles.disabled]}
                    onPress={() => reviewAttempt(attempt.id, 'approve')}
                    disabled={!!acting}
                  >
                    <Text style={styles.approveText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.rejectBtn, acting === `attempt-${attempt.id}-reject` && styles.disabled]}
                    onPress={() => reviewAttempt(attempt.id, 'reject')}
                    disabled={!!acting}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
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
  title: { flex: 1, textAlign: 'center', ...typography.label },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  error: { ...typography.caption, color: colors.destructive, marginBottom: spacing.md },
  sectionTitle: {
    ...typography.heading,
    fontSize: 18,
    color: colors.foreground,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  empty: { ...typography.caption, color: colors.mutedForeground, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { ...typography.label, fontSize: 16, color: colors.foreground },
  cardMeta: { ...typography.caption, color: colors.mutedForeground, marginTop: 4 },
  cardBody: { ...typography.body, fontSize: 14, marginTop: spacing.sm, color: colors.foreground },
  note: { ...typography.caption, color: colors.mutedForeground, marginTop: spacing.sm },
  proof: { marginTop: spacing.sm, aspectRatio: 4 / 5 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  approveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveText: { ...typography.label, color: colors.primaryForeground },
  rejectBtn: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectText: { ...typography.label, color: colors.foreground },
  disabled: { opacity: 0.6 },
})
