import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../../components/ui/button'
import { Screen } from '../../components/ui/screen'
import { AuthLoading, useAuthToken } from '../../hooks/use-auth-token'
import {
  captureAvatarWithCamera,
  pickAvatarImage,
} from '../../lib/pick-media'
import {
  fetchMyProfile,
  resolveMediaUrl,
  updateMyProfile,
  uploadAvatar,
} from '../../lib/api'
import { colors, radius, spacing, typography } from '../../constants/theme'

export default function EditProfileScreen() {
  const { token, loading: authLoading } = useAuthToken()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchMyProfile(token)
      .then((data) => {
        setName(data.user?.name ?? '')
        setBio(data.user?.bio ?? '')
        setAvatarUrl(data.user?.avatarUrl ?? null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const pickAvatar = async (source: 'camera' | 'library') => {
    if (!token || uploadingAvatar) return
    setAvatarError(null)
    const picked =
      source === 'camera' ? await captureAvatarWithCamera() : await pickAvatarImage()
    if (!picked) return

    setUploadingAvatar(true)
    try {
      const result = await uploadAvatar(token, picked)
      setAvatarUrl(result.user.avatarUrl)
    } catch (e) {
      setAvatarError(e instanceof Error ? e.message : 'Could not upload photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const save = async () => {
    if (!token) return
    setSaving(true)
    try {
      await updateMyProfile(token, {
        name: name.trim() || undefined,
        bio: bio.trim(),
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <AuthLoading />

  const avatarUri = resolveMediaUrl(avatarUrl)

  return (
    <Screen padded={false}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>
        <View style={styles.back} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Profile photo</Text>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={36} color={colors.mutedForeground} />
              </View>
            )}
            {uploadingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.primaryForeground} />
              </View>
            ) : null}
          </View>
          <View style={styles.avatarActions}>
            <Pressable
              onPress={() => pickAvatar('camera')}
              style={styles.avatarBtn}
              disabled={uploadingAvatar}
            >
              <Ionicons name="camera-outline" size={18} color={colors.foreground} />
              <Text style={styles.avatarBtnText}>Camera</Text>
            </Pressable>
            <Pressable
              onPress={() => pickAvatar('library')}
              style={styles.avatarBtn}
              disabled={uploadingAvatar}
            >
              <Ionicons name="images-outline" size={18} color={colors.foreground} />
              <Text style={styles.avatarBtnText}>Photos</Text>
            </Pressable>
          </View>
        </View>
        {avatarError ? <Text style={styles.avatarError}>{avatarError}</Text> : null}

        <Text style={styles.label}>Display name</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Your name" />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          style={[styles.input, styles.bioInput]}
          placeholder="Tell people about yourself"
          multiline
          maxLength={280}
        />
        <Text style={styles.hint}>{bio.length}/280</Text>

        <Button label={saving ? 'Saving…' : 'Save'} onPress={save} disabled={saving} style={styles.save} />
      </ScrollView>
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
  title: { flex: 1, textAlign: 'center', ...typography.label },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  label: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.md },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.muted,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: { flex: 1, gap: spacing.sm },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  avatarBtnText: { ...typography.caption, fontWeight: '600', color: colors.foreground },
  avatarError: { ...typography.caption, color: colors.destructive, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.card,
    ...typography.body,
    fontSize: 15,
    color: colors.foreground,
  },
  bioInput: { minHeight: 100, textAlignVertical: 'top' },
  hint: { ...typography.caption, color: colors.mutedForeground, marginTop: 4 },
  save: { marginTop: spacing.lg },
})
