import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { resolveMediaUrl } from '../../lib/api'
import { formatRelativeTime } from '../../lib/format-time'
import { colors, radius, spacing, typography } from '../../constants/theme'

export type ActivityItem = {
  id: string
  proofUrl?: string | null
  updatedAt: string
  source?: 'friend' | 'public'
  user: { username: string; name: string | null; avatarUrl?: string | null }
  challenge: { id: string; title: string; points: number }
}

function displayName(user: ActivityItem['user']) {
  return user.name ?? user.username
}

export function ActivityCard({ item }: { item: ActivityItem }) {
  const initials = displayName(item.user)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const proofUri = resolveMediaUrl(item.proofUrl ?? null)

  return (
    <Pressable
      onPress={() => router.push(`/attempt/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{displayName(item.user)}</Text>
          <Text style={styles.subtitle}>
            completed <Text style={styles.challengeTitle}>{item.challenge.title}</Text>
          </Text>
          <Text style={styles.time}>{formatRelativeTime(item.updatedAt)}</Text>
        </View>
        <View style={styles.points}>
          <Ionicons name="trophy" size={14} color={colors.primary} />
          <Text style={styles.pointsText}>+{item.challenge.points}</Text>
        </View>
      </View>

      {proofUri ? (
        <Image source={{ uri: proofUri }} style={styles.proofThumb} resizeMode="cover" />
      ) : null}

      {item.source === 'friend' ? <Text style={styles.badge}>Friend</Text> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.92 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, color: colors.foreground, fontSize: 13 },
  meta: { flex: 1 },
  name: { ...typography.label, color: colors.foreground },
  subtitle: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
  challengeTitle: { color: colors.foreground, fontWeight: '600' },
  time: { ...typography.caption, color: colors.mutedForeground, marginTop: 4, fontSize: 12 },
  points: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  proofThumb: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    backgroundColor: colors.muted,
  },
  badge: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
})
