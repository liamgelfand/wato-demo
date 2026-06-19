import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { createChallengeSchema } from '@/lib/validations'
import { validateChallengeContent } from '@/lib/moderation'
import { calculateChallengePoints } from '@/lib/points'
import { applyChallengeAiReview, REVIEW_IN_PROGRESS } from '@/lib/apply-challenge-ai-review'
import { scheduleBackgroundWork } from '@/lib/schedule-background'
import type { ChallengeCategory } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const user = await getApiUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createChallengeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, description, category, difficulty, prerequisiteChallengeId } = validation.data

    const contentValidation = validateChallengeContent({ title, description, category })
    if (!contentValidation.isValid) {
      return NextResponse.json({ errors: contentValidation.errors }, { status: 400 })
    }

    if (prerequisiteChallengeId) {
      const prereq = await prisma.challenge.findFirst({
        where: { id: prerequisiteChallengeId, status: 'ACTIVE' },
      })
      if (!prereq) {
        return NextResponse.json({ error: 'Prerequisite challenge not found' }, { status: 400 })
      }
    }

    const points = calculateChallengePoints(10, difficulty)

    const challenge = await prisma.challenge.create({
      data: {
        creatorId: user.id,
        title,
        description,
        category: category as ChallengeCategory,
        difficulty,
        basePoints: 10,
        points,
        status: 'PENDING_REVIEW',
        prerequisiteChallengeId: prerequisiteChallengeId ?? null,
        aiReviewNote: REVIEW_IN_PROGRESS,
      },
    })

    scheduleBackgroundWork(async () => {
      try {
        await applyChallengeAiReview(challenge.id, title, description, {
          id: user.id,
          username: user.username,
        })
      } catch (error) {
        console.error('Background AI review failed:', error)
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: {
            aiReviewNote: 'AI review failed. A moderator will review this challenge.',
          },
        })
      }
    })

    return NextResponse.json(challenge, { status: 201 })
  } catch (error) {
    console.error('Challenge creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
