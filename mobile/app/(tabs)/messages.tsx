import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui/button'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchMessageThreads } from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

type ThreadItem = {
  id: string
  otherUser: { id: string; username: string; name: string | null }
  lastMessage: { body: string; createdAt: string; isMine: boolean } | null
  unread: boolean
}

function displayName(user: ThreadItem['otherUser']) {
  return user.name ?? user.username
}

function preview(body: string) {
  return body.length > 80 ? `${body.slice(0, 80)}…` : body
}

export default function MessagesTab() {
  const { token, loading: authLoading } = useAuthToken()
  const [threads, setThreads] = useState<ThreadItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (accessToken: string) => {
    setError(null)
    const data = await fetchMessageThreads(accessToken)
    setThreads(data.threads ?? [])
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load messages'))
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

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>Share challenges and hype with friends</Text>
          </View>
          <Pressable
            onPress={() => router.push('/messages/new')}
            style={styles.newBtn}
            accessibilityLabel="New message"
          >
            <Ionicons name="create-outline" size={24} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <Button label="New message" onPress={() => router.push('/messages/new')} />
        </View>
      ) : null}
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyBody}>Start a conversation with a friend.</Text>
              <Button
                label="New message"
                onPress={() => router.push('/messages/new')}
                style={styles.emptyBtn}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const initials = displayName(item.otherUser)
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <Pressable
              onPress={() => router.push(`/messages/${item.id}`)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.meta}>
                <Text style={[styles.name, item.unread && styles.unreadName]}>
                  {displayName(item.otherUser)}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage
                    ? `${item.lastMessage.isMine ? 'You: ' : ''}${preview(item.lastMessage.body)}`
                    : 'No messages yet'}
                </Text>
              </View>
              {item.unread ? <View style={styles.dot} /> : null}
            </Pressable>
          )
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
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1 },
  headerTitle: { ...typography.title, fontSize: 26, color: colors.foreground },
  headerSubtitle: { ...typography.caption, color: colors.mutedForeground, marginTop: 4 },
  newBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: { padding: spacing.md, gap: spacing.sm },
  error: { ...typography.caption, color: colors.destructive },
  list: { flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: spacing.lg },
  emptyTitle: { ...typography.heading, fontSize: 18, color: colors.foreground, marginBottom: 6 },
  emptyBody: { ...typography.caption, color: colors.mutedForeground, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.md, alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.muted },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, fontSize: 14 },
  meta: { flex: 1 },
  name: { ...typography.label, color: colors.foreground },
  unreadName: { fontWeight: '800' },
  preview: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
})
