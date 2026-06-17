import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { storage } from '@/lib/storage'
import { resolveProofMimeType } from '@/lib/proof-files'
import { getModeratorUserIds } from '@/lib/moderators'
import { createNotification } from '@/lib/notifications'
import path from 'path'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const attemptId = formData.get('attemptId') as string

    if (!file || !attemptId) {
      return NextResponse.json(
        { error: 'Missing file or attemptId' },
        { status: 400 }
      )
    }

    // Verify attempt ownership
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { challenge: { select: { title: true } } },
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attempt not found or unauthorized' },
        { status: 404 }
      )
    }

    if (attempt.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Cannot upload proof for this attempt' },
        { status: 400 }
      )
    }

    const mimeType = resolveProofMimeType(file.name, file.type)
    if (!mimeType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPG, PNG, GIF, WebP, MP4, MOV, or WebM file.' },
        { status: 400 }
      )
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name).toLowerCase()
    const filePath = `${attempt.userId}/${attemptId}${ext}`
    
    const storageProvider = storage()
    const proofUrl = await storageProvider.uploadFile(buffer, filePath, mimeType)

    // Update attempt
    await prisma.attempt.update({
      where: { id: attemptId },
      data: {
        proofUrl,
        proofType: mimeType,
        proofMetadata: {
          originalName: file.name,
          size: file.size,
          mimeType,
        },
        status: 'PENDING',
      },
    })

    const moderatorIds = await getModeratorUserIds()
    await Promise.all(
      moderatorIds.map((moderatorId) =>
        createNotification({
          userId: moderatorId,
          type: 'VERIFICATION_REQUEST',
          referenceType: 'ATTEMPT',
          referenceId: attemptId,
          title: 'Attempt needs review',
          body: `${session.user.username} submitted proof for "${attempt.challenge.title}"`,
        })
      )
    )

    // TODO: AI proof verification hook can be called here
    // await verifyProofWithAI(proofUrl, attempt.challengeId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Proof upload error:', error)
    const message =
      error instanceof Error && process.env.NODE_ENV !== 'production'
        ? error.message
        : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
