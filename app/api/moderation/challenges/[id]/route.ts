import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { hasPermission, Permissions } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(user.role, Permissions.CHALLENGES_APPROVE)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json()) as { action?: string }
  const action = body.action

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { creatorId: true, status: true },
  })

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  if (challenge.status !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'Challenge is not pending review' }, { status: 400 })
  }

  if (challenge.creatorId === user.id) {
    return NextResponse.json({ error: 'Cannot review your own challenge' }, { status: 400 })
  }

  await prisma.challenge.update({
    where: { id },
    data: {
      status: action === 'approve' ? 'ACTIVE' : 'REJECTED',
      aiReviewNote:
        action === 'approve'
          ? 'Approved by moderator.'
          : 'Rejected by moderator.',
    },
  })

  return NextResponse.json({ success: true })
}
