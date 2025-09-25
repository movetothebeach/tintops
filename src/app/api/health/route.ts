import { NextResponse } from 'next/server'
import { createServerClient } from '@/core/lib/supabase/server'
import { stripe } from '@/core/lib/stripe'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      stripe: 'unknown',
      environment: 'unknown',
    }
  }

  // Check database connection
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.from('organizations').select('id').limit(1)
    checks.checks.database = error ? 'unhealthy' : 'healthy'
  } catch {
    checks.checks.database = 'unhealthy'
    checks.status = 'degraded'
  }

  // Check Stripe connection
  try {
    // Try to retrieve a price to verify Stripe connection
    await stripe.prices.list({ limit: 1 })
    checks.checks.stripe = 'healthy'
  } catch {
    checks.checks.stripe = 'unhealthy'
    checks.status = 'degraded'
  }

  // Check environment variables
  try {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ]

    const missingVars = requiredVars.filter(v => !process.env[v])
    checks.checks.environment = missingVars.length === 0 ? 'healthy' : 'unhealthy'

    if (missingVars.length > 0) {
      checks.status = 'degraded'
    }
  } catch {
    checks.checks.environment = 'unhealthy'
    checks.status = 'degraded'
  }

  // Return appropriate status code
  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}

// Liveness check - just returns OK if the service is running
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}