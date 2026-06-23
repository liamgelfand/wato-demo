import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { resolveMediaUrl, type SocialUser } from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

type SocialUserListProps = {
  users: SocialUser[]
  emptyMessage: string
}

function displayName(user: SocialUser) {
  return user.name ?? user.username
}

export function SocialUserList({ users, emptyMessage }: SocialUserListProps) {
  if (users.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const avatarUri = resolveMediaUrl(item.avatarUrl)
        return (
          <View style={styles.row}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{displayName(item).slice(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.meta}>
              <Text style={styles.name}>{displayName(item)}</Text>
              <Text style={styles.handle}>@{item.username}</Text>
            </View>
          </View>
        )
      }}
    />
  )
}

type SocialListScreenProps = {
  title: string
  users: SocialUser[]
  loading: boolean
  emptyMessage: string
  onBack: () => void
}

export function SocialListScreen({
  title,
  users,
  loading,
  emptyMessage,
  onBack,
}: SocialListScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>{title}</Text>
        <View style={styles.back} />
      </View>
      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : (
        <SocialUserList users={users} emptyMessage={emptyMessage} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', ...typography.label },
  loading: { ...typography.body, color: colors.mutedForeground, textAlign: 'center', padding: spacing.lg },
  list: { padding: spacing.md, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, fontSize: 16 },
  meta: { flex: 1 },
  name: { ...typography.label, color: colors.foreground },
  handle: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: { ...typography.body, color: colors.mutedForeground, textAlign: 'center' },
})
