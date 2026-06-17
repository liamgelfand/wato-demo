import path from 'path'

export const PROOF_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const

export type ProofMimeType = (typeof PROOF_MIME_TYPES)[number]

const EXTENSION_MIME: Record<string, ProofMimeType> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
}

export function isProofMimeType(type: string): type is ProofMimeType {
  return (PROOF_MIME_TYPES as readonly string[]).includes(type)
}

/** Browsers on Windows often leave `file.type` empty; infer from extension when needed. */
export function resolveProofMimeType(fileName: string, reportedType: string): ProofMimeType | null {
  if (isProofMimeType(reportedType)) {
    return reportedType
  }

  const ext = path.extname(fileName).toLowerCase()
  return EXTENSION_MIME[ext] ?? null
}
