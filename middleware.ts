import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { applyCorsHeaders, corsHeaders } from '@/lib/cors'

function withCors(request: NextRequest, response: NextResponse): NextResponse {
  applyCorsHeaders(request, response.headers)
  return response
}

export async function middleware(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith('/api/')

  if (isApi && request.method === 'OPTIONS') {
    const headers = corsHeaders(request)
    if (!headers['Access-Control-Allow-Origin']) {
      return new NextResponse(null, { status: 403 })
    }
    return new NextResponse(null, { status: 204, headers })
  }

  if (isApi) {
    if (request.nextUrl.pathname.startsWith('/api/auth')) {
      return withCors(request, NextResponse.next())
    }

    const skipRateLimit =
      process.env.DISABLE_RATE_LIMIT === 'true' ||
      process.env.NODE_ENV === 'development'

    if (skipRateLimit) {
      return withCors(request, NextResponse.next())
    }

    const identifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    if (request.nextUrl.pathname.includes('/challenges/create')) {
      const limit = await rateLimit(`create-challenge:${identifier}`, 10, 24 * 60 * 60 * 1000)
      if (!limit.allowed) {
        return withCors(
          request,
          NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Maximum 10 challenges per day',
              retryAfter: Math.ceil((limit.reset - Date.now()) / 1000),
            },
            { status: 429 }
          )
        )
      }
    }

    if (request.nextUrl.pathname.includes('/friends/send-request')) {
      const limit = await rateLimit(`friend-request:${identifier}`, 5, 60 * 60 * 1000)
      if (!limit.allowed) {
        return withCors(
          request,
          NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Maximum 5 friend requests per hour',
              retryAfter: Math.ceil((limit.reset - Date.now()) / 1000),
            },
            { status: 429 }
          )
        )
      }
    }

    if (request.nextUrl.pathname.includes('/messages') && request.method === 'POST') {
      const limit = await rateLimit(`message:${identifier}`, 20, 60 * 1000)
      if (!limit.allowed) {
        return withCors(
          request,
          NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Please slow down. Maximum 20 messages per minute',
              retryAfter: Math.ceil((limit.reset - Date.now()) / 1000),
            },
            { status: 429 }
          )
        )
      }
    }

    const limit = await rateLimit(`api-general:${identifier}`, 100, 60 * 1000)
    if (!limit.allowed) {
      return withCors(
        request,
        NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later',
            retryAfter: Math.ceil((limit.reset - Date.now()) / 1000),
          },
          { status: 429 }
        )
      )
    }

    return withCors(request, NextResponse.next())
  }

  const response = NextResponse.next()
  response.headers.set('X-Request-ID', crypto.randomUUID())
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
