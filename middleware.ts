import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from 'redis'
import { hashSessionToken } from '@/lib/crypto'

// ============================================
// REDIS CLIENT (Singleton)
// ============================================

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

function getRedis() {
  if (!globalForRedis.redis) {
    globalForRedis.redis = createClient({ url: process.env.REDIS_URL })
    globalForRedis.redis.on('error', err => console.error('Redis error:', err))
    globalForRedis.redis.connect().catch(err => console.error('Redis connect error:', err))
  }
  return globalForRedis.redis
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix: string
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth:login': { windowMs: 60_000, maxRequests: 5, keyPrefix: 'rl:login' },
  'auth:register': { windowMs: 60_000, maxRequests: 3, keyPrefix: 'rl:register' },
  'auth:forgot-password': { windowMs: 60_000, maxRequests: 3, keyPrefix: 'rl:forgot' },
  'api:default': { windowMs: 60_000, maxRequests: 100, keyPrefix: 'rl:api' },
  'api:auth': { windowMs: 60_000, maxRequests: 60, keyPrefix: 'rl:api:auth' },
}

async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfter?: number }> {
  const redis = getRedis()
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  await redis.zRemRangeByScore(key, 0, windowStart)
  const count = await redis.zCard(key)

  if (count >= config.maxRequests) {
    const oldest = await redis.zRange(key, 0, 0, { withScores: true })
    const resetTime = oldest.length > 0 ? oldest[0].score + config.windowMs : now + config.windowMs
    const retryAfter = Math.ceil((resetTime - now) / 1000)
    return { allowed: false, remaining: 0, resetTime, retryAfter }
  }

  await redis.zAdd(key, { score: now, value: `${now}:${Math.random()}` })
  await redis.expire(key, Math.ceil(config.windowMs / 1000) + 1)

  return { allowed: true, remaining: config.maxRequests - count - 1, resetTime: now + config.windowMs }
}

// ============================================
// CSP NONCE GENERATION
// ============================================

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

// ============================================
// PROTECTED ROUTES
// ============================================

const PROTECTED_PREFIXES = ['/dashboard', '/api/']
const PUBLIC_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/api/auth', '/_next', '/favicon.ico', '/public']

function isProtected(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return false
  return PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
}

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const nonce = generateNonce()
  const pathname = request.nextUrl.pathname

  // CSP Header with nonce
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.sentry.io",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.headers.set('x-csp-nonce', nonce)

  // Rate limiting for auth endpoints
  if (pathname.startsWith('/api/auth/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const configKey = pathname.includes('/login') ? 'auth:login'
      : pathname.includes('/register') ? 'auth:register'
      : pathname.includes('/forgot-password') ? 'auth:forgot-password'
      : 'auth:default'

    const config = RATE_LIMITS[configKey] || RATE_LIMITS['auth:default']
    const { allowed, remaining, resetTime, retryAfter } = await checkRateLimit(ip, config)

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter?.toString() || '60',
            ...Object.fromEntries(response.headers.entries()),
          },
        }
      )
    }
  }

  // Rate limiting for API endpoints
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const sessionToken = request.cookies.get('session')?.value
    const identifier = sessionToken ? `user:${hashSessionToken(sessionToken)}` : `ip:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'}`

    const config = sessionToken ? RATE_LIMITS['api:auth'] : RATE_LIMITS['api:default']
    const { allowed, remaining, resetTime, retryAfter } = await checkRateLimit(identifier, config)

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter?.toString() || '60',
            ...Object.fromEntries(response.headers.entries()),
          },
        }
      )
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}