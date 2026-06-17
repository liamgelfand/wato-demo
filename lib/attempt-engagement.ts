import type { AttemptReactionType } from '@prisma/client'

export const REACTION_OPTIONS: Array<{
  type: AttemptReactionType
  label: string
  emoji: string
}> = [
  { type: 'FIRE', label: 'Fire', emoji: '🔥' },
  { type: 'CLAP', label: 'Clap', emoji: '👏' },
  { type: 'LAUGH', label: 'Laugh', emoji: '😂' },
  { type: 'WOW', label: 'Wow', emoji: '😮' },
  { type: 'STRONG', label: 'Strong', emoji: '💪' },
]

export function canEngageOnAttempt(status: string): boolean {
  return status === 'PENDING' || status === 'APPROVED'
}
