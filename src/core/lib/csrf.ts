import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = '__Host-csrf'

export function generateCSRFToken(): string {
  // Use Web Crypto API for edge runtime compatibility
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function setCSRFToken(response: NextResponse): string {
  const token = generateCSRFToken()

  // Set as httpOnly cookie for double-submit pattern
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })

  // Also set in a readable cookie for client to include in headers
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })

  return token
}

export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  // Skip for webhook endpoints (they have their own verification)
  if (request.nextUrl.pathname.startsWith('/api/stripe/webhooks')) {
    return true
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  // Get token from header or body
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return false
  }

  // Validate tokens match
  return cookieToken === headerToken
}

export function getCSRFToken(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_TOKEN_NAME)?.value
}