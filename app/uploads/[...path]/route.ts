import { NextRequest, NextResponse } from 'next/server'
import { readdirSync, existsSync } from 'fs'
import { readFile as readFileAsync } from 'fs/promises'
import path from 'path'
import { resolveProofMimeType } from '@/lib/proof-files'

function getUploadsDir(): string {
  return process.env.UPLOADS_DIR?.trim() || path.join(process.cwd(), 'public', 'uploads')
}

async function readUploadFile(filePath: string, fileName: string): Promise<NextResponse> {
  const buffer = await readFileAsync(filePath)
  const mimeType = resolveProofMimeType(fileName, '') || 'application/octet-stream'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  if (!segments?.length) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const uploadsDir = path.resolve(getUploadsDir())
  const filePath = path.resolve(uploadsDir, ...segments)

  if (filePath !== uploadsDir && !filePath.startsWith(uploadsDir + path.sep)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (existsSync(filePath)) {
    return readUploadFile(filePath, segments[segments.length - 1])
  }

  // Legacy uploads may use mixed-case extensions on case-sensitive filesystems
  const parent = path.dirname(filePath)
  const base = path.basename(filePath)
  if (existsSync(parent)) {
    const match = readdirSync(parent).find((name) => name.toLowerCase() === base.toLowerCase())
    if (match) {
      return readUploadFile(path.join(parent, match), match)
    }
  }

  return new NextResponse('Not Found', { status: 404 })
}
