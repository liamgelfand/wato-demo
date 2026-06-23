import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params
    const user = await getApiUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const comment = await prisma.attemptComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, attemptId: true },
    })
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const existing = await prisma.attemptCommentUpvote.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } },
    })

    if (existing) {
      await prisma.attemptCommentUpvote.delete({ where: { id: existing.id } })
      const count = await prisma.attemptCommentUpvote.count({ where: { commentId } })
      return NextResponse.json({ upvoted: false, count })
    }

    await prisma.attemptCommentUpvote.create({
      data: { commentId, userId: user.id },
    })
    const count = await prisma.attemptCommentUpvote.count({ where: { commentId } })
    return NextResponse.json({ upvoted: true, count })
  } catch (error) {
    console.error('Comment upvote error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
