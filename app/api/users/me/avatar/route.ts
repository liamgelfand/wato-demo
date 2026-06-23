import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { prisma } from '@/lib/db'
import { storage } from '@/lib/storage'

const AVATAR_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  try {
    const user = await getApiUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const mimeType = file.type || 'image/jpeg'
    if (!AVATAR_MIME.has(mimeType)) {
      return NextResponse.json(
        { error: 'Please upload a JPG, PNG, or WebP image.' },
        { status: 400 }
      )
    }

    const ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg'
    const filePath = `avatars/${user.id}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 })
    }

    const avatarUrl = await storage().uploadFile(buffer, filePath, mimeType)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
      select: { id: true, username: true, name: true, bio: true, avatarUrl: true },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
