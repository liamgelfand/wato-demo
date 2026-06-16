import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { submitReportSchema } from '@/lib/validations'
import type { ReportTargetType } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const validation = submitReportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { targetType, targetId, reason, details } = validation.data

    // Verify target exists
    if (targetType === 'CHALLENGE') {
      const challenge = await prisma.challenge.findUnique({
        where: { id: targetId },
      })
      if (!challenge) {
        return NextResponse.json(
          { error: 'Challenge not found' },
          { status: 404 }
        )
      }
    } else if (targetType === 'ATTEMPT') {
      const attempt = await prisma.attempt.findUnique({
        where: { id: targetId },
      })
      if (!attempt) {
        return NextResponse.json(
          { error: 'Attempt not found' },
          { status: 404 }
        )
      }
    }

    // Create report
    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType: targetType as ReportTargetType,
        targetId,
        reason,
        details: details || null,
        status: 'OPEN',
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Report submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
