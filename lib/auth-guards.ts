import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import type { UserRole } from '@prisma/client'
import { auth } from '@/lib/auth'
import { hasPermission, type Permission } from '@/lib/permissions'

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 403
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireUser(): Promise<Session> {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  return session
}

export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await requireUser()
  if (!hasPermission(session.user.role, permission)) {
    redirect('/')
  }
  return session
}

/** For server actions — throws instead of redirecting. */
export async function requireActionPermission(permission: Permission): Promise<Session> {
  const session = await auth()
  if (!session?.user) {
    throw new AuthError('Unauthorized', 401)
  }
  if (!hasPermission(session.user.role, permission)) {
    throw new AuthError('Forbidden', 403)
  }
  return session
}

export function requireApiPermission(
  role: UserRole | undefined,
  permission: Permission
): NextResponse | null {
  if (!role) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function requireApiUser(): Promise<Session | NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return session
}
