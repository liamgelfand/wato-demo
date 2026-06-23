import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import { fetchMessageThread, sendMessage } from '../../lib/api'
import { formatMessageTime } from '../../lib/format-time'
import { colors, radius, spacing, typography } from '../../constants/theme'

type Message = {
  id: string
  body: string
  createdAt: string
  readAt: string | null
  sender: { id: string; username: string; name: string | null }
}

export default function MessageThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  const { token, loading: authLoading } = useAuthToken()
  const insets = useSafeAreaInsets()
  const [messages, setMessages] = useState<Message[]>([])
  const [otherName, setOtherName] = useState('Chat')
  const [myId, setMyId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    if (!token || !threadId) return
    const data = await fetchMessageThread(token, threadId)
    setMessages(data.messages ?? [])
    setMyId(data.viewerId ?? null)
    const thread = data.thread
    if (thread && data.viewerId) {
      const other = thread.userA.id === data.viewerId ? thread.userB : thread.userA
      setOtherName(other.name ?? other.username)
    }
  }, [token, threadId])

  useEffect(() => {
    if (!token || !threadId) return
    load()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, threadId, load])

  const onSend = async () => {
    if (!token || !threadId || !draft.trim() || sending) return
    setSending(true)
    const body = draft.trim()
    setDraft('')
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
      sender: { id: myId ?? '', username: 'you', name: 'You' },
    }
    setMessages((prev) => [...prev, optimistic])
    try {
      await sendMessage(token, threadId, body)
      await load()
    } catch {
      setDraft(body)
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  if (authLoading || loading) return <AuthLoading />

  const keyboardOffset = insets.top + 48

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>{otherName}</Text>
        <View style={styles.backBtn} />
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => {
            // allows swipe-down dismiss on iOS via keyboardDismissMode
          }}
          renderItem={({ item }) => {
            const mine = myId ? item.sender.id === myId : false
            return (
              <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirsWrap]}>
                <View style={[styles.bubble, mine ? styles.mineBubble : styles.theirsBubble]}>
                  <Text style={[styles.bubbleText, mine && styles.mineText]}>{item.body}</Text>
                </View>
                <View style={[styles.metaRow, mine && styles.metaRowMine]}>
                  <Text style={styles.timeText}>{formatMessageTime(item.createdAt)}</Text>
                  {mine && item.readAt ? (
                    <Text style={styles.seenText}> · Seen</Text>
                  ) : null}
                </View>
              </View>
            )
          }}
        />
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            multiline
            returnKeyType="default"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={onSend}
            disabled={!draft.trim() || sending}
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendDisabled]}
          >
            <Ionicons name="send" size={20} color={colors.primaryForeground} />
          </Pressable>
        </View>
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
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { ...typography.heading, fontSize: 17, flex: 1, textAlign: 'center' },
  messages: { padding: spacing.md, flexGrow: 1 },
  bubbleWrap: { marginBottom: spacing.sm },
  mineWrap: { alignItems: 'flex-end' },
  theirsWrap: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  mineBubble: { backgroundColor: colors.primary },
  theirsBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bubbleText: { ...typography.body, fontSize: 15, color: colors.foreground },
  mineText: { color: colors.primaryForeground },
  metaRow: { flexDirection: 'row', marginTop: 4, paddingHorizontal: 4 },
  metaRowMine: { justifyContent: 'flex-end' },
  timeText: { ...typography.caption, fontSize: 11, color: colors.mutedForeground },
  seenText: { ...typography.caption, fontSize: 11, color: colors.primary, fontWeight: '600' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    ...typography.body,
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
})
