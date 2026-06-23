import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import {
  CATEGORY_LABELS,
  CATEGORY_STYLES,
  type ChallengeCategory,
} from '../../constants/categories'
import { colors, radius, spacing, typography } from '../../constants/theme'

export type ChallengeItem = {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  points: number
  difficulty: number
  creator?: { username: string; name: string | null }
}

type ChallengeCardProps = {
  challenge: ChallengeItem
  onPress?: () => void
}

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const cat = CATEGORY_STYLES[challenge.category] ?? CATEGORY_STYLES.FUNNY

  const open = () => {
    if (onPress) {
      onPress()
      return
    }
    router.push(`/challenge/${challenge.id}`)
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: cat.bg }]}>
          <Text style={[styles.badgeText, { color: cat.text }]}>
            {CATEGORY_LABELS[challenge.category] ?? challenge.category}
          </Text>
        </View>
        <Text style={styles.points}>{challenge.points} pts</Text>
      </View>
      <Text style={styles.title}>{challenge.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {challenge.description}
      </Text>
      {challenge.creator && (
        <Text style={styles.creator}>by @{challenge.creator.username}</Text>
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
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
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
  points: {
    ...typography.label,
    color: colors.primary,
  },
  title: {
    ...typography.label,
    fontSize: 17,
    color: colors.foreground,
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    color: colors.mutedForeground,
  },
  creator: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
  },
})
