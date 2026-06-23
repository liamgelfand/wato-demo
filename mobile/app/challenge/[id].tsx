import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui/button'
import { Screen } from '../../components/ui/screen'
import { ProofUploader } from '../../components/media/proof-media'
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  type ChallengeCategory,
} from '../../constants/categories'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchChallenge, startChallengeAttempt } from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

type ChallengeDetail = {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  points: number
  difficulty: number
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'REJECTED'
  aiReviewNote?: string | null
  prerequisiteMet: boolean
  draftAttemptId: string | null
  creator: { username: string; name: string | null }
  prerequisiteChallenge?: { id: string; title: string } | null
}

export default function ChallengeDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>()
  const challengeId = Array.isArray(params.id) ? params.id[0] : params.id
  const { token, loading: authLoading } = useAuthToken()
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token || !challengeId) return
    setError(null)
    const data = await fetchChallenge(token, challengeId)
    setChallenge(data)
    if (data.draftAttemptId) {
      setAttemptId(data.draftAttemptId)
    }
  }, [token, challengeId])

  useEffect(() => {
    if (!token || !challengeId) return
    setLoading(true)
    load()
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Could not load this challenge.')
      )
      .finally(() => setLoading(false))
  }, [token, challengeId, load])

  useFocusEffect(
    useCallback(() => {
      if (!token || !challengeId) return
      load().catch((e) =>
        setError(e instanceof Error ? e.message : 'Could not load this challenge.')
      )
    }, [token, challengeId, load])
  )

  useEffect(() => {
    if (!token || !challengeId || challenge?.status !== 'PENDING_REVIEW') return
    const interval = setInterval(() => {
      load().catch(() => {})
    }, 4000)
    return () => clearInterval(interval)
  }, [token, challengeId, challenge?.status, load])

  const onStart = async () => {
    if (!token || !challengeId) return
    setStarting(true)
    setError(null)
    try {
      const { attemptId: id } = await startChallengeAttempt(token, challengeId)
      setAttemptId(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start challenge')
    } finally {
      setStarting(false)
    }
  }

  if (authLoading || loading) return <AuthLoading />

  const cat = challenge
    ? (CATEGORY_STYLES[challenge.category] ?? CATEGORY_STYLES.FUNNY)
    : null

  const showProofUpload =
    !!attemptId && !!token && challenge?.status === 'ACTIVE' && challenge.prerequisiteMet

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Challenge
        </Text>
        <View style={styles.back} />
      </View>

      {!challenge ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Challenge not found.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {cat && (
            <View style={[styles.badge, { backgroundColor: cat.bg }]}>
              <Text style={[styles.badgeText, { color: cat.text }]}>
                {CATEGORY_LABELS[challenge.category]}
              </Text>
            </View>
          )}
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.meta}>
            {challenge.points} pts · difficulty {challenge.difficulty}/5 · @
            {challenge.creator.username}
          </Text>
          <Text style={styles.description}>{challenge.description}</Text>

          {challenge.prerequisiteChallenge && !challenge.prerequisiteMet && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Complete “{challenge.prerequisiteChallenge.title}” first to unlock this
                challenge.
              </Text>
            </View>
          )}

          {error && <Text style={styles.inlineError}>{error}</Text>}

          {showProofUpload ? (
            <ProofUploader
              attemptId={attemptId}
              accessToken={token}
              onSuccess={() => load().catch(() => {})}
            />
          ) : challenge.status !== 'ACTIVE' ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                {challenge.status === 'PENDING_REVIEW'
                  ? challenge.aiReviewNote === 'AI review in progress…'
                    ? 'AI review is running (usually 10–20 seconds). This screen updates automatically.'
                    : (challenge.aiReviewNote ?? 'Waiting for AI or moderator approval.')
                  : (challenge.aiReviewNote ?? 'This challenge was not approved.')}
              </Text>
            </View>
          ) : (
            <Button
              label={challenge.draftAttemptId ? 'Continue attempt' : 'Start challenge'}
              onPress={onStart}
              loading={starting}
              disabled={!challenge.prerequisiteMet}
            />
          )}
        </ScrollView>
      )}
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
    backgroundColor: colors.background,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    ...typography.label,
    color: colors.foreground,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  title: {
    ...typography.heading,
    fontSize: 24,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.foreground,
    marginBottom: spacing.lg,
  },
  notice: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  inlineError: {
    ...typography.caption,
    color: colors.destructive,
    marginBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
})
