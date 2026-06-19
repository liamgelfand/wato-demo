import { prisma } from '@/lib/db'
import { reviewChallengeWithAI } from '@/lib/challenge-ai-review'
import { getModeratorUserIds } from '@/lib/moderators'
import { createNotification } from '@/lib/notifications'
import type { ChallengeStatus } from '@prisma/client'

export const REVIEW_IN_PROGRESS = 'AI review in progress…'

export async function applyChallengeAiReview(
  challengeId: string,
  title: string,
  description: string,
  creator: { id: string; username: string }
): Promise<void> {
  const aiReview = await reviewChallengeWithAI(title, description)

  let status: ChallengeStatus = 'PENDING_REVIEW'
  let aiReviewNote = 'Waiting for moderator approval'

  if (!aiReview) {
    aiReviewNote =
      'AI review unavailable (OLLAMA_URL not configured). A moderator will review this challenge.'
  } else if (!aiReview.safe) {
    status = 'REJECTED'
    aiReviewNote = aiReview.note
  } else if (aiReview.autoApprove) {
    status = 'ACTIVE'
    aiReviewNote = aiReview.note
  } else {
    aiReviewNote = `${aiReview.note} — waiting for moderator approval.`
  }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { status, aiReviewNote },
  })

  if (status !== 'PENDING_REVIEW') {
    return
  }

  const moderatorIds = (await getModeratorUserIds()).filter((id) => id !== creator.id)
  if (moderatorIds.length === 0) return

  await Promise.all(
    moderatorIds.map((moderatorId) =>
      createNotification({
        userId: moderatorId,
        type: 'CHALLENGE_REVIEW_REQUEST',
        referenceType: 'CHALLENGE',
        referenceId: challengeId,
        title: 'New challenge needs review',
        body: `${creator.username} submitted "${title}" for approval`,
      })
    )
  )
}
