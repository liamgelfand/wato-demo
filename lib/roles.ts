import type { UserRole } from '@prisma/client'
import { hasPermission, Permissions } from '@/lib/permissions'

/** @deprecated Prefer hasPermission(role, Permissions.ATTEMPTS_VERIFY) */
export function canVerifyAttempts(role: UserRole | undefined): boolean {
  return hasPermission(role, Permissions.ATTEMPTS_VERIFY)
}

export { hasPermission, Permissions, type Permission } from '@/lib/permissions'
