import { describe, expect, it } from '@jest/globals'
import {
  Permissions,
  getPermissionsForRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from '@/lib/permissions'

describe('permissions', () => {
  it('grants no permissions to USER', () => {
    expect(getPermissionsForRole('USER')).toEqual([])
    expect(hasPermission('USER', Permissions.ATTEMPTS_VERIFY)).toBe(false)
    expect(hasPermission('USER', Permissions.REPORTS_VIEW)).toBe(false)
  })

  it('grants moderation permissions to MODERATOR', () => {
    expect(hasPermission('MODERATOR', Permissions.ATTEMPTS_VERIFY)).toBe(true)
    expect(hasPermission('MODERATOR', Permissions.ATTEMPTS_VIEW_ANY)).toBe(true)
    expect(hasPermission('MODERATOR', Permissions.REPORTS_VIEW)).toBe(false)
    expect(hasPermission('MODERATOR', Permissions.CHALLENGES_HIDE)).toBe(false)
  })

  it('grants all permissions to ADMIN', () => {
    expect(hasAllPermissions('ADMIN', Object.values(Permissions))).toBe(true)
  })

  it('supports any/all helpers', () => {
    expect(
      hasAnyPermission('MODERATOR', [
        Permissions.REPORTS_VIEW,
        Permissions.ATTEMPTS_VERIFY,
      ])
    ).toBe(true)
    expect(
      hasAllPermissions('MODERATOR', [
        Permissions.ATTEMPTS_VERIFY,
        Permissions.REPORTS_VIEW,
      ])
    ).toBe(false)
  })
})
