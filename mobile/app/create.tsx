import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Screen } from '../components/ui/screen'
import { useAuthToken } from '../hooks/use-auth-token'
import { createChallenge } from '../lib/api'
import {
  CATEGORY_LABELS,
  type ChallengeCategory,
} from '../constants/categories'
import { colors, radius, spacing, typography } from '../constants/theme'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ChallengeCategory[]

export default function CreateChallengeScreen() {
  const { token } = useAuthToken()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ChallengeCategory>('FITNESS')
  const [difficulty, setDifficulty] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const challenge = await createChallenge(token, {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
      })
      router.replace(`/challenge/${challenge.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create challenge')
      setLoading(false)
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>New challenge</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {error && <Text style={styles.error}>{error}</Text>}

          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="30 pushups in 1 minute"
            maxLength={100}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What should people do?"
            multiline
            numberOfLines={4}
            style={styles.textArea}
            maxLength={500}
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[styles.chip, category === cat && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Difficulty ({difficulty}/5)</Text>
          <View style={styles.difficultyRow}>
            {[1, 2, 3, 4, 5].map((level) => (
              <Pressable
                key={level}
                onPress={() => setDifficulty(level)}
                style={[styles.dot, level <= difficulty && styles.dotActive]}
              />
            ))}
          </View>

          <Button label="Create challenge" onPress={onSubmit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconBtn: {
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
  form: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  error: {
    ...typography.caption,
    color: colors.destructive,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryForeground,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
})
