'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { Permissions } from '@/lib/permissions'
import { requireActionPermission, AuthError } from '@/lib/auth-guards'

export async function resolveReportAction(
  reportId: string,
  action: 'RESOLVED' | 'DISMISSED'
): Promise<void> {
  await requireActionPermission(Permissions.REPORTS_RESOLVE)
  await prisma.report.update({
    where: { id: reportId },
    data: { status: action },
  })
  revalidatePath('/admin')
}

export async function hideChallengeAction(challengeId: string): Promise<void> {
  await requireActionPermission(Permissions.CHALLENGES_HIDE)
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'HIDDEN' },
  })
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function approveAttemptAction(attemptId: string): Promise<void> {
  await requireActionPermission(Permissions.ATTEMPTS_VERIFY)
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { challenge: true },
  })
  if (!attempt) return

  const { awardPoints } = await import('@/lib/points')
  await awardPoints(attempt.userId, attemptId, attempt.challenge.points)
  revalidatePath('/admin')
  revalidatePath(`/attempt/${attemptId}`)
  revalidatePath('/')
}

export async function rejectAttemptAction(attemptId: string): Promise<void> {
  await requireActionPermission(Permissions.ATTEMPTS_VERIFY)
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { status: 'REJECTED' },
  })
  revalidatePath('/admin')
  revalidatePath(`/attempt/${attemptId}`)
}

export async function approveChallengeAction(challengeId: string): Promise<void> {
  const session = await requireActionPermission(Permissions.CHALLENGES_APPROVE)
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { creatorId: true },
  })
  if (!challenge) return
  if (challenge.creatorId === session.user.id) {
    throw new AuthError('You cannot approve your own challenge', 403)
  }
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'ACTIVE' },
  })
  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath(`/challenge/${challengeId}`)
}

export async function rejectChallengeAction(challengeId: string): Promise<void> {
  const session = await requireActionPermission(Permissions.CHALLENGES_APPROVE)
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { creatorId: true },
  })
  if (!challenge) return
  if (challenge.creatorId === session.user.id) {
    throw new AuthError('You cannot reject your own challenge', 403)
  }
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status: 'REJECTED' },
  })
  revalidatePath('/admin')
  revalidatePath(`/challenge/${challengeId}`)
}
