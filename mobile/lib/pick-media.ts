import * as ImagePicker from 'expo-image-picker'
import { Alert, Linking } from 'react-native'

export type PickedMedia = {
  uri: string
  mimeType: string
  fileName: string
  isVideo: boolean
}

function extensionForMime(mime: string, isVideo: boolean): string {
  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('quicktime') || mime.endsWith('mov')) return '.mov'
  if (mime.includes('mp4')) return '.mp4'
  if (mime.includes('webm')) return '.webm'
  return isVideo ? '.mp4' : '.jpg'
}

function assetToMedia(
  asset: ImagePicker.ImagePickerAsset,
  prefix: string
): PickedMedia {
  const isVideo = asset.type === 'video'
  const mimeType =
    asset.mimeType ??
    (isVideo ? 'video/mp4' : 'image/jpeg')
  const ext = extensionForMime(mimeType, isVideo)
  return {
    uri: asset.uri,
    mimeType,
    fileName: asset.fileName ?? `${prefix}-${Date.now()}${ext}`,
    isVideo,
  }
}

async function ensurePermission(
  request: () => Promise<ImagePicker.PermissionResponse>,
  label: string
): Promise<boolean> {
  const { status } = await request()
  if (status === 'granted') return true
  Alert.alert(
    `${label} access needed`,
    `Enable ${label.toLowerCase()} access in Settings to continue.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Settings', onPress: () => Linking.openSettings() },
    ]
  )
  return false
}

export async function pickProofFromLibrary(): Promise<PickedMedia | null> {
  const ok = await ensurePermission(
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
    'Photos'
  )
  if (!ok) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.85,
    videoMaxDuration: 120,
  })
  if (result.canceled || !result.assets[0]) return null
  return assetToMedia(result.assets[0], 'proof')
}

export async function captureProofWithCamera(): Promise<PickedMedia | null> {
  const ok = await ensurePermission(
    () => ImagePicker.requestCameraPermissionsAsync(),
    'Camera'
  )
  if (!ok) return null

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    quality: 0.85,
    videoMaxDuration: 120,
  })
  if (result.canceled || !result.assets[0]) return null
  return assetToMedia(result.assets[0], 'proof')
}

export async function pickAvatarImage(): Promise<PickedMedia | null> {
  const ok = await ensurePermission(
    () => ImagePicker.requestMediaLibraryPermissionsAsync(),
    'Photos'
  )
  if (!ok) return null

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  })
  if (result.canceled || !result.assets[0]) return null
  return assetToMedia(result.assets[0], 'avatar')
}

export async function captureAvatarWithCamera(): Promise<PickedMedia | null> {
  const ok = await ensurePermission(
    () => ImagePicker.requestCameraPermissionsAsync(),
    'Camera'
  )
  if (!ok) return null

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  })
  if (result.canceled || !result.assets[0]) return null
  return assetToMedia(result.assets[0], 'avatar')
}
