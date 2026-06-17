import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canViewAttempt } from '@/lib/attempt-access'
import { canEngageOnAttempt } from '@/lib/attempt-engagement'

export async function getEngageableAttempt(attemptId: string, userId: string, role?: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { user: { select: { isPrivate: true } } },
  })

  if (!attempt) return null

  const allowed = await canViewAttempt(
    userId,
    {
      userId: attempt.userId,
      status: attempt.status,
      ownerIsPrivate: attempt.user.isPrivate,
    },
    role as 'USER' | 'MODERATOR' | 'ADMIN' | undefined
  )

  if (!allowed || !canEngageOnAttempt(attempt.status)) return null

  return attempt
}
