import type { AttemptStatus, UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { areFriends } from '@/lib/friends'
import { hasPermission, Permissions } from '@/lib/permissions'

interface AttemptAccessContext {
  userId: string
  status: AttemptStatus
  ownerIsPrivate?: boolean
}

export async function canViewAttempt(
  viewerId: string,
  attempt: AttemptAccessContext,
  viewerRole?: UserRole
): Promise<boolean> {
  if (attempt.userId === viewerId) return true
  if (hasPermission(viewerRole, Permissions.ATTEMPTS_VIEW_ANY)) return true

  switch (attempt.status) {
    case 'PENDING':
      return areFriends(viewerId, attempt.userId)
    case 'APPROVED': {
      if (await areFriends(viewerId, attempt.userId)) return true
      if (attempt.ownerIsPrivate === undefined) {
        const owner = await prisma.user.findUnique({
          where: { id: attempt.userId },
          select: { isPrivate: true },
        })
        return !owner?.isPrivate
      }
      return !attempt.ownerIsPrivate
    }
    default:
      return false
  }
}