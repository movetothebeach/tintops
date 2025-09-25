import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/core/lib/supabase/middleware'
import { validateCSRFToken, setCSRFToken } from '@/core/lib/csrf'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/confirm',
  '/auth/callback',
  '/api/stripe/webhooks',
  '/api/auth/check-email',
]

// Routes that require authentication but not organization
const AUTH_ONLY_ROUTES = [
  '/onboarding',
  '/subscription-setup',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Validate CSRF token for mutations
  if (pathname.startsWith('/api/') && !validateCSRFToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request)

  // Add comprehensive security headers to all responses
  const response = supabaseResponse

  // Set CSRF token if not present
  if (!request.cookies.get('csrf-token')) {
    setCSRFToken(response)
  }
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Download-Options', 'noopen')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co; " +
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests;"
  )

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isPublicRoute) {
    // Allow access to public routes
    // But redirect authenticated users away from auth pages
    if (user && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // If no user, redirect to login
  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if route only requires authentication
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isAuthOnlyRoute) {
    return response
  }

  // For protected routes, we need to check organization
  // This will be handled by the route itself since we need to fetch from DB
  // Middleware just ensures authentication

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/stripe/webhooks (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}