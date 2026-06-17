import type { UserRole } from '@prisma/client'

export const Permissions = {
  ATTEMPTS_VERIFY: 'attempts.verify',
  ATTEMPTS_VIEW_ANY: 'attempts.view_any',
  REPORTS_VIEW: 'reports.view',
  REPORTS_RESOLVE: 'reports.resolve',
  CHALLENGES_HIDE: 'challenges.hide',
  CHALLENGES_VIEW_ADMIN: 'challenges.view_admin',
} as const

export type Permission = (typeof Permissions)[keyof typeof Permissions]

const MODERATOR_PERMISSIONS: readonly Permission[] = [
  Permissions.ATTEMPTS_VERIFY,
  Permissions.ATTEMPTS_VIEW_ANY,
]

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...MODERATOR_PERMISSIONS,
  Permissions.REPORTS_VIEW,
  Permissions.REPORTS_RESOLVE,
  Permissions.CHALLENGES_HIDE,
  Permissions.CHALLENGES_VIEW_ADMIN,
]

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  USER: [],
  MODERATOR: MODERATOR_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
}

export function getPermissionsForRole(role: UserRole | undefined): readonly Permission[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role]
}

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission
): boolean {
  return getPermissionsForRole(role).includes(permission)
}

export function hasAnyPermission(
  role: UserRole | undefined,
  permissions: readonly Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

export function hasAllPermissions(
  role: UserRole | undefined,
  permissions: readonly Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}
