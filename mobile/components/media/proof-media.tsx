import { useState } from 'react'
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../../constants/theme'

type ProofMediaProps = {
  uri: string
  proofType?: string | null
  style?: object
}

export function isVideoProof(proofType?: string | null): boolean {
  return !!proofType && proofType.startsWith('video/')
}

export function ProofMedia({ uri, proofType, style }: ProofMediaProps) {
  if (isVideoProof(proofType)) {
    return (
      <Video
        source={{ uri }}
        style={[styles.media, style]}
        useNativeControls
        resizeMode={ResizeMode.COVER}
        isLooping={false}
      />
    )
  }
  return <Image source={{ uri }} style={[styles.media, style]} resizeMode="cover" />
}

type ProofUploaderProps = {
  attemptId: string
  accessToken: string
  onSuccess?: () => void
}

export function ProofUploader({ attemptId, accessToken, onSuccess }: ProofUploaderProps) {
  const [media, setMedia] = useState<import('../../lib/pick-media').PickedMedia | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const pick = async (source: 'camera' | 'library') => {
    setError(null)
    const {
      captureProofWithCamera,
      pickProofFromLibrary,
    } = await import('../../lib/pick-media')
    const picked =
      source === 'camera'
        ? await captureProofWithCamera()
        : await pickProofFromLibrary()
    if (picked) setMedia(picked)
  }

  const submit = async () => {
    if (!media || uploading) return
    setUploading(true)
    setError(null)
    try {
      const { uploadProof } = await import('../../lib/api')
      await uploadProof(accessToken, attemptId, media)
      setDone(true)
      onSuccess?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <View style={styles.success}>
        <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
        <Text style={styles.successTitle}>Proof submitted</Text>
        <Text style={styles.successBody}>
          Your proof is pending review. You will get points once it is approved.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Submit proof</Text>
      <Text style={styles.hint}>Photo or video from your camera or library.</Text>

      {media ? (
        <View style={styles.preview}>
          {media.isVideo ? (
            <Video
              source={{ uri: media.uri }}
              style={styles.previewMedia}
              useNativeControls
              resizeMode={ResizeMode.COVER}
            />
          ) : (
            <Image source={{ uri: media.uri }} style={styles.previewMedia} resizeMode="cover" />
          )}
          <Pressable onPress={() => setMedia(null)} style={styles.clearBtn}>
            <Text style={styles.clearText}>Choose different</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => pick('camera')} style={styles.actionBtn}>
            <Ionicons name="camera-outline" size={22} color={colors.foreground} />
            <Text style={styles.actionLabel}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => pick('library')} style={styles.actionBtn}>
            <Ionicons name="images-outline" size={22} color={colors.foreground} />
            <Text style={styles.actionLabel}>Photos</Text>
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {media ? (
        <Pressable
          onPress={submit}
          disabled={uploading}
          style={[styles.submitBtn, uploading && styles.submitDisabled]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.submitText}>Submit proof</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  media: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
  },
  wrap: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  heading: {
    ...typography.label,
    color: colors.foreground,
    marginBottom: 4,
  },
  hint: {
    ...typography.caption,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.foreground,
  },
  preview: { marginBottom: spacing.sm },
  previewMedia: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  clearBtn: { alignSelf: 'center', marginTop: spacing.sm, padding: spacing.xs },
  clearText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  error: {
    ...typography.caption,
    color: colors.destructive,
    marginTop: spacing.sm,
  },
  submitBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    ...typography.label,
    color: colors.primaryForeground,
  },
  success: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  successTitle: {
    ...typography.label,
    color: colors.foreground,
  },
  successBody: {
    ...typography.caption,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
})
