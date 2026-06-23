import { useCallback, useEffect, useState } from 'react'
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui/button'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchMyProfile, resolveMediaUrl } from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

type ProfileUser = {
  username: string
  name: string | null
  bio?: string | null
  avatarUrl?: string | null
  totalPoints: number
  completedCount: number
  createdCount: number
  pendingCreatedCount?: number
  friendsCount?: number
  followersCount?: number
  followingCount?: number
  canModerate?: boolean
}

export default function ProfileTab() {
  const { token, loading: authLoading } = useAuthToken()
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (accessToken: string) => {
    const data = await fetchMyProfile(accessToken)
    setUser(data.user)
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, load])

  useFocusEffect(
    useCallback(() => {
      if (!token) return
      load(token).catch(() => {})
    }, [token, load])
  )

  const onRefresh = async () => {
    if (!token) return
    setRefreshing(true)
    try {
      await load(token)
    } finally {
      setRefreshing(false)
    }
  }

  const signOut = async () => {
    const { deleteItemAsync } = await import('../../lib/storage')
    await deleteItemAsync('accessToken')
    await deleteItemAsync('refreshToken')
    router.replace('/login')
  }

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable onPress={() => router.push('/profile/edit')} style={styles.editBtn}>
          <Ionicons name="create-outline" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {user && (
          <>
            <View style={styles.profileTop}>
              {resolveMediaUrl(user.avatarUrl) ? (
                <Image source={{ uri: resolveMediaUrl(user.avatarUrl)! }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(user.name ?? user.username).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileMeta}>
                <Text style={styles.name}>{user.name ?? user.username}</Text>
                <Text style={styles.handle}>@{user.username}</Text>
              </View>
            </View>
            {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.totalPoints}</Text>
                <Text style={styles.statLabel}>Points</Text>
                <Text style={styles.statHint}>From completed challenges</Text>
              </View>

              <Pressable style={styles.stat} onPress={() => router.push('/profile/completed')}>
                <Text style={styles.statValue}>{user.completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statHint}>Tap to view · earns pts</Text>
              </Pressable>

              <Pressable style={styles.stat} onPress={() => router.push('/profile/created')}>
                <Text style={styles.statValue}>{user.createdCount}</Text>
                <Text style={styles.statLabel}>Created</Text>
                <Text style={styles.statHint}>
                  {(user.pendingCreatedCount ?? 0) > 0
                    ? `${user.pendingCreatedCount} in review · tap to view`
                    : 'Tap to view all statuses'}
                </Text>
              </Pressable>

              <Pressable style={styles.stat} onPress={() => router.push('/profile/friends')}>
                <Text style={styles.statValue}>{user.friendsCount ?? 0}</Text>
                <Text style={styles.statLabel}>Friends</Text>
                <Text style={styles.statHint}>Mutual follows · tap to view</Text>
              </Pressable>

              <Pressable style={styles.stat} onPress={() => router.push('/profile/followers')}>
                <Text style={styles.statValue}>{user.followersCount ?? 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
                <Text style={styles.statHint}>Tap to view</Text>
              </Pressable>

              <Pressable style={styles.stat} onPress={() => router.push('/profile/following')}>
                <Text style={styles.statValue}>{user.followingCount ?? 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
                <Text style={styles.statHint}>Tap to view</Text>
              </Pressable>

              {user.canModerate ? (
                <Pressable style={styles.stat} onPress={() => router.push('/profile/review')}>
                  <View style={styles.reviewRow}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                    <Text style={styles.statLabel}>Review queue</Text>
                  </View>
                  <Text style={styles.statHint}>Approve challenges & proof submissions</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}

        <Button label="Sign out" variant="secondary" onPress={signOut} style={styles.signOut} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 26,
    color: colors.foreground,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.heading, fontSize: 20 },
  profileMeta: { flex: 1 },
  name: {
    ...typography.heading,
    color: colors.foreground,
  },
  handle: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  bio: {
    ...typography.body,
    fontSize: 15,
    color: colors.foreground,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  stats: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  stat: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statValue: {
    ...typography.heading,
    fontSize: 24,
    color: colors.foreground,
  },
  statLabel: {
    ...typography.label,
    color: colors.foreground,
    marginTop: 2,
  },
  statHint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signOut: {
    marginTop: spacing.sm,
  },
})
