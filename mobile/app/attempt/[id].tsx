import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import {
  API_URL,
  commentOnAttempt,
  fetchAttempt,
  resolveMediaUrl,
  upvoteAttempt,
  upvoteComment,
} from '../../lib/api'
import { formatRelativeTime, formatTimestamp } from '../../lib/format-time'
import { ProofMedia } from '../../components/media/proof-media'
import { colors, radius, spacing, typography } from '../../constants/theme'

type CommentUser = {
  id: string
  username: string
  name: string | null
  avatarUrl?: string | null
}

type Comment = {
  id: string
  body: string
  createdAt: string
  user: CommentUser
  upvoteCount: number
  userUpvoted: boolean
  replies: Comment[]
}

type AttemptPost = {
  id: string
  updatedAt: string
  proofUrl: string | null
  proofType: string | null
  user: CommentUser
  challenge: { id: string; title: string; points: number }
  engagement: {
    canEngage: boolean
    upvoteCount: number
    userUpvoted: boolean
    comments: Comment[]
  }
}

function displayName(user: CommentUser) {
  return user.name ?? user.username
}

export default function AttemptPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { token, loading: authLoading } = useAuthToken()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const [post, setPost] = useState<AttemptPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentBody, setCommentBody] = useState('')
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!token || !id) return
    const data = await fetchAttempt(token, id)
    setPost(data)
  }, [token, id])

  useEffect(() => {
    if (!token || !id) return
    load()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, id, load])

  const toggleLike = async () => {
    if (!token || !post) return
    const result = await upvoteAttempt(token, post.id)
    setPost({
      ...post,
      engagement: {
        ...post.engagement,
        upvoteCount: result.count,
        userUpvoted: result.upvoted,
      },
    })
  }

  const submitComment = async () => {
    if (!token || !post || !commentBody.trim() || submitting) return
    setSubmitting(true)
    try {
      await commentOnAttempt(token, post.id, commentBody.trim(), replyTo?.id)
      setCommentBody('')
      setReplyTo(null)
      Keyboard.dismiss()
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCommentLike = async (commentId: string) => {
    if (!token || !post) return
    await upvoteComment(token, commentId)
    await load()
  }

  const onShare = async () => {
    if (!post) return
    await Share.share({
      message: `${displayName(post.user)} completed "${post.challenge.title}" on Wato! ${API_URL}/attempt/${post.id}`,
    })
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <View key={comment.id} style={[styles.comment, isReply && styles.reply]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{displayName(comment.user)}</Text>
        <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
      </View>
      <Text style={styles.commentBody}>{comment.body}</Text>
      <View style={styles.commentActions}>
        <Pressable onPress={() => toggleCommentLike(comment.id)} style={styles.commentAction}>
          <Ionicons
            name={comment.userUpvoted ? 'heart' : 'heart-outline'}
            size={16}
            color={comment.userUpvoted ? colors.primary : colors.mutedForeground}
          />
          <Text style={styles.commentActionText}>{comment.upvoteCount || ''}</Text>
        </Pressable>
        {!isReply && post?.engagement.canEngage ? (
          <Pressable onPress={() => setReplyTo(comment)} style={styles.commentAction}>
            <Text style={styles.commentActionText}>Reply</Text>
          </Pressable>
        ) : null}
      </View>
      {comment.replies?.map((r) => renderComment(r, true))}
    </View>
  )

  if (authLoading || loading) return <AuthLoading />
  if (!post) {
    return (
      <Screen>
        <Text style={styles.error}>Could not load this post.</Text>
      </Screen>
    )
  }

  const proofUri = resolveMediaUrl(post.proofUrl)
  const keyboardOffset = insets.top + 48

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {displayName(post.user)}
        </Text>
        <Pressable onPress={onShare} style={styles.backBtn}>
          <Ionicons name="share-outline" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.completedMeta}>
            Completed <Text style={styles.challengeLink}>{post.challenge.title}</Text>
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(post.updatedAt)}</Text>

          {proofUri ? (
            <ProofMedia uri={proofUri} proofType={post.proofType} style={styles.proof} />
          ) : (
            <View style={styles.proofPlaceholder}>
              <Ionicons name="image-outline" size={40} color={colors.mutedForeground} />
              <Text style={styles.proofPlaceholderText}>No proof media</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable onPress={toggleLike} style={styles.likeBtn}>
              <Ionicons
                name={post.engagement.userUpvoted ? 'heart' : 'heart-outline'}
                size={22}
                color={post.engagement.userUpvoted ? colors.primary : colors.foreground}
              />
              <Text style={styles.likeCount}>{post.engagement.upvoteCount} likes</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/challenge/${post.challenge.id}`)}>
              <Text style={styles.viewChallenge}>View challenge · +{post.challenge.points} pts</Text>
            </Pressable>
          </View>

          <Text style={styles.commentsTitle}>Comments</Text>
          {post.engagement.comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            post.engagement.comments.map((c) => renderComment(c))
          )}
        </ScrollView>

        {post.engagement.canEngage ? (
          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            {replyTo ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  Replying to {displayName(replyTo.user)}
                </Text>
                <Pressable onPress={() => setReplyTo(null)}>
                  <Ionicons name="close" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.composerRow}>
              <TextInput
                value={commentBody}
                onChangeText={setCommentBody}
                placeholder="Add a comment…"
                placeholderTextColor={colors.mutedForeground}
                style={styles.commentInput}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={submitComment}
                disabled={!commentBody.trim() || submitting}
                style={[styles.sendBtn, (!commentBody.trim() || submitting) && styles.sendDisabled]}
              >
                <Ionicons name="send" size={18} color={colors.primaryForeground} />
              </Pressable>
            </View>
          </View>
        ) : null}
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
  topTitle: { flex: 1, textAlign: 'center', ...typography.label, fontSize: 16 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  completedMeta: { ...typography.body, color: colors.foreground },
  challengeLink: { fontWeight: '700', color: colors.primary },
  timestamp: { ...typography.caption, color: colors.mutedForeground, marginTop: 4, marginBottom: spacing.md },
  proof: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
  },
  proofPlaceholder: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  proofPlaceholderText: { ...typography.caption, color: colors.mutedForeground },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { ...typography.label, color: colors.foreground },
  viewChallenge: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  commentsTitle: { ...typography.heading, fontSize: 18, marginBottom: spacing.sm },
  noComments: { ...typography.caption, color: colors.mutedForeground, marginBottom: spacing.md },
  comment: { marginBottom: spacing.md },
  reply: { marginLeft: spacing.lg, marginTop: spacing.sm },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  commentAuthor: { ...typography.label, fontSize: 14 },
  commentTime: { ...typography.caption, color: colors.mutedForeground },
  commentBody: { ...typography.body, fontSize: 15, marginTop: 4 },
  commentActions: { flexDirection: 'row', gap: spacing.md, marginTop: 6 },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionText: { ...typography.caption, color: colors.mutedForeground },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  replyBannerText: { ...typography.caption, color: colors.mutedForeground, flex: 1 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.background,
    ...typography.body,
    fontSize: 15,
    color: colors.foreground,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  error: { ...typography.body, color: colors.destructive, textAlign: 'center', padding: spacing.lg },
})
