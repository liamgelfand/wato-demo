import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { createMessageThread, fetchFriends } from '../../lib/api'
import { colors, spacing, typography } from '../../constants/theme'

type Friend = { id: string; username: string; name: string | null }

export default function NewMessageScreen() {
  const { token, loading: authLoading } = useAuthToken()
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState<string | null>(null)

  const load = useCallback(async (accessToken: string) => {
    setError(null)
    const data = await fetchFriends(accessToken)
    setFriends(data.friends ?? [])
  }, [])

  useEffect(() => {
    if (!token) return
    load(token)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load friends'))
      .finally(() => setLoading(false))
  }, [token, load])

  const startChat = async (friendId: string) => {
    if (!token || starting) return
    setStarting(friendId)
    try {
      const { threadId } = await createMessageThread(token, friendId)
      router.replace(`/messages/${threadId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start chat')
    } finally {
      setStarting(null)
    }
  }

  if (authLoading || loading) return <AuthLoading />

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>New message</Text>
        <View style={styles.back} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No friends found. Add friends on the web app first.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => startChat(item.id)}
            disabled={starting === item.id}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.name}>{item.name ?? item.username}</Text>
            <Text style={styles.handle}>@{item.username}</Text>
          </Pressable>
        )}
      />
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
  title: { flex: 1, textAlign: 'center', ...typography.label, color: colors.foreground },
  error: {
    ...typography.caption,
    color: colors.destructive,
    padding: spacing.md,
  },
  list: { flexGrow: 1 },
  empty: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
    padding: spacing.xl,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.muted },
  name: { ...typography.label, color: colors.foreground },
  handle: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
})
