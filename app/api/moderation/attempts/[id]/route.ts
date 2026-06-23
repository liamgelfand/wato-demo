import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { awardPoints } from '@/lib/points'
import { hasPermission, Permissions } from '@/lib/permissions'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(user.role, Permissions.ATTEMPTS_VERIFY)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json()) as { action?: string; reason?: string }
  const action = body.action

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: { challenge: true },
  })

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  }

  if (attempt.status !== 'PENDING') {
    return NextResponse.json({ error: 'Attempt is not pending' }, { status: 400 })
  }

  if (attempt.userId === user.id) {
    return NextResponse.json({ error: 'Cannot review your own attempt' }, { status: 400 })
  }

  if (action === 'approve') {
    await awardPoints(attempt.userId, id, attempt.challenge.points)
  } else {
    await prisma.attempt.update({
      where: { id },
      data: { status: 'REJECTED' },
    })
  }

  return NextResponse.json({ success: true })
}
