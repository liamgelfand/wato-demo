import type { PickedMedia } from './pick-media'

export function buildUploadForm(
  media: PickedMedia,
  fields: Record<string, string>
): FormData {
  const form = new FormData()
  form.append('file', {
    uri: media.uri,
    name: media.fileName,
    type: media.mimeType,
  } as unknown as Blob)
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value)
  }
  return form
}
