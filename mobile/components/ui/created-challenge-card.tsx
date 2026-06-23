import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  type ChallengeCategory,
} from '../../constants/categories'
import { colors, radius, spacing, typography } from '../../constants/theme'
import type { ChallengeItem } from './challenge-card'

export type CreatedChallengeItem = ChallengeItem & {
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'REJECTED' | 'HIDDEN'
  aiReviewNote?: string | null
}

const STATUS_LABELS: Record<CreatedChallengeItem['status'], string> = {
  ACTIVE: 'Live',
  PENDING_REVIEW: 'In review',
  REJECTED: 'Rejected',
  HIDDEN: 'Hidden',
}

const STATUS_COLORS: Record<CreatedChallengeItem['status'], { bg: string; text: string }> = {
  ACTIVE: { bg: '#d8f3dc', text: '#2d6a4f' },
  PENDING_REVIEW: { bg: '#fef3c7', text: '#92400e' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c' },
  HIDDEN: { bg: colors.muted, text: colors.mutedForeground },
}

export function CreatedChallengeCard({ challenge }: { challenge: CreatedChallengeItem }) {
  const cat = CATEGORY_STYLES[challenge.category] ?? CATEGORY_STYLES.FUNNY
  const statusStyle = STATUS_COLORS[challenge.status] ?? STATUS_COLORS.PENDING_REVIEW

  return (
    <Pressable
      onPress={() => router.push(`/challenge/${challenge.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.badgeText, { color: cat.text }]}>
            {CATEGORY_LABELS[challenge.category as ChallengeCategory] ?? challenge.category}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[challenge.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.meta}>{challenge.points} pts · difficulty {challenge.difficulty}/5</Text>
      {challenge.status === 'PENDING_REVIEW' && challenge.aiReviewNote && (
        <Text style={styles.note} numberOfLines={2}>
          {challenge.aiReviewNote}
        </Text>
      )}
      {challenge.status === 'REJECTED' && challenge.aiReviewNote && (
        <Text style={styles.note} numberOfLines={2}>
          {challenge.aiReviewNote}
        </Text>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  title: {
    ...typography.label,
    fontSize: 17,
    color: colors.foreground,
    marginBottom: 4,
  },
  meta: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  note: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
})
